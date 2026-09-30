import "server-only";

import { createHash, randomInt } from "node:crypto";
import { and, desc, eq, gt, inArray, isNotNull, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { channelLinks, donations, users, type ChannelLink, type ChatChannel, type User } from "@/db/schema";
import { draftDonationFrom, draftNeedFrom } from "@/lib/ai/graph";
import { aiEnabled } from "@/lib/ai/provider";
import type { DonationDraft, NeedDraft } from "@/lib/ai/schemas";
import { ACTIVE_STATUSES, CATEGORY_LABEL, CONDITION_LABEL, STATUS_META, UNIT_SHORT } from "@/lib/donations/meta";
import { createDonation } from "@/lib/donations/service";
import { createNeed, matchOpenNeeds } from "@/lib/requests/service";
import { rateLimited } from "@/lib/rate-limit";
import { formatDateTime } from "@/lib/utils";
import { donationSchema, fieldErrors, needSchema } from "@/lib/validation";
import { CHAT_CHANNEL_LABEL, CHAT_HELP, LINK_CODE_MINUTES, NOT_LINKED_REPLY, PENDING_HOURS } from "./meta";
import { missingForDonation, missingForNeed, parseDonationText, parseNeedText } from "./parse";

/*
 * Chat apps → n8n → this module (Segment 17). n8n posts each incoming message to
 * /api/integrations/inbound and sends our reply back; outgoing status updates reuse the
 * notification outbox. Nothing here bypasses the website's rules: drafts go through the same zod
 * schemas and services as the web forms, and nothing is created until the user replies YES.
 * Removing the integration means deleting this folder, the route and the profile card.
 */

const hash = (code: string) => createHash("sha256").update(code).digest("hex");
const toLocal = (ms: number) => new Date(ms).toISOString().slice(0, 16); // parsed with tzOffset 0 (UTC)
const appLink = (path: string) => (process.env.APP_URL ? `\n${process.env.APP_URL.replace(/\/$/, "")}${path}` : "");

/* ------------------------------------------------------------ linking */

export async function listChannelLinks(userId: string) {
  const db = await getDb();
  return db
    .select({ channel: channelLinks.channel, linkedAt: channelLinks.linkedAt, externalId: channelLinks.externalId, codeExpiresAt: channelLinks.codeExpiresAt })
    .from(channelLinks)
    .where(eq(channelLinks.userId, userId));
}

/** A fresh one-time code for linking a chat app (only its hash is stored). */
export async function createLinkCode(userId: string, channel: ChatChannel) {
  const db = await getDb();
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const expires = new Date(Date.now() + LINK_CODE_MINUTES * 60_000);
  await db
    .insert(channelLinks)
    .values({ userId, channel, codeHash: hash(code), codeExpiresAt: expires })
    .onConflictDoUpdate({ target: [channelLinks.userId, channelLinks.channel], set: { codeHash: hash(code), codeExpiresAt: expires } });
  return { code, expires };
}

export async function unlinkChannel(userId: string, channel: ChatChannel) {
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.delete(channelLinks).where(and(eq(channelLinks.userId, userId), eq(channelLinks.channel, channel)));
    await tx.update(users).set({ notifyChannels: sql`array_remove(${users.notifyChannels}, ${channel})` }).where(eq(users.id, userId));
  });
}

/** Completes a link from the chat side: "LINK 123456". Returns the linked user or null. */
async function redeemCode(channel: ChatChannel, from: string, code: string) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(channelLinks)
      .where(and(eq(channelLinks.channel, channel), eq(channelLinks.codeHash, hash(code)), gt(channelLinks.codeExpiresAt, new Date())));
    if (!row) return null;
    // One chat account belongs to one FoodBridge user: take it over from any earlier link.
    const previous = await tx
      .delete(channelLinks)
      .where(and(eq(channelLinks.channel, channel), eq(channelLinks.externalId, from), ne(channelLinks.userId, row.userId)))
      .returning({ userId: channelLinks.userId });
    if (previous.length) {
      await tx
        .update(users)
        .set({ notifyChannels: sql`array_remove(${users.notifyChannels}, ${channel})` })
        .where(inArray(users.id, previous.map((p) => p.userId)));
    }
    await tx
      .update(channelLinks)
      .set({ externalId: from, linkedAt: new Date(), codeHash: null, codeExpiresAt: null, pendingKind: null, pendingText: null, pendingDraft: null, pendingAt: null })
      .where(eq(channelLinks.id, row.id));
    // Linking opts in to status updates on that app (the user can switch it off in their profile).
    const [user] = await tx
      .update(users)
      .set({ notifyChannels: sql`array(select distinct unnest(array_append(${users.notifyChannels}, ${channel})))` })
      .where(eq(users.id, row.userId))
      .returning();
    return user;
  });
}

/* ---------------------------------------------------------- rate limit */

const limited = (key: string, max: number, windowMs: number) => rateLimited(`chat:${key}`, max, windowMs);

/* ------------------------------------------------------------- drafts */

type Pending = { kind: "donation" | "need"; text: string };

async function setPending(linkId: string, pending: Pending | null, draft: object | null = null) {
  const db = await getDb();
  await db
    .update(channelLinks)
    .set(
      pending
        ? { pendingKind: pending.kind, pendingText: pending.text.slice(-2000), pendingDraft: draft ? JSON.stringify(draft) : null, pendingAt: new Date() }
        : { pendingKind: null, pendingText: null, pendingDraft: null, pendingAt: null },
    )
    .where(eq(channelLinks.id, linkId));
}

async function readDonation(text: string): Promise<DonationDraft> {
  if (aiEnabled()) {
    try {
      return (await draftDonationFrom([{ role: "user", content: text }])).draft;
    } catch {
      // AI busy or unavailable: fall back to the rule-based reader.
    }
  }
  return parseDonationText(text);
}

async function readNeed(text: string): Promise<NeedDraft> {
  if (aiEnabled()) {
    try {
      return (await draftNeedFrom([{ role: "user", content: text }])).draft;
    } catch {
      // fall back below
    }
  }
  return parseNeedText(text);
}

/** Form values exactly as the web form would send them, from a draft plus the user's profile. */
function donationForm(d: DonationDraft, user: User) {
  const now = Date.now();
  const ownAddress = !d.pickupAddress;
  return {
    foodType: d.foodType ?? "",
    category: d.category ?? "",
    quantity: d.quantity ?? "",
    unit: d.unit ?? "",
    condition: d.condition ?? "",
    preparedAt: toLocal(now - (d.preparedMinutesAgo ?? 0) * 60_000),
    expiresAt: d.bestBeforeInHours !== null ? toLocal(now + d.bestBeforeInHours * 3_600_000) : "",
    pickupAt: toLocal(now + (d.pickupInMinutes ?? 30) * 60_000),
    pickupAddress: d.pickupAddress || user.address || "",
    pickupLat: ownAddress && user.lat !== null ? String(user.lat) : "",
    pickupLng: ownAddress && user.lng !== null ? String(user.lng) : "",
    contactName: user.name,
    contactPhone: user.phone,
    instructions: d.instructions ?? "",
    tzOffset: "0",
  };
}

function needForm(d: NeedDraft, user: User) {
  return {
    category: d.category ?? "",
    foodType: d.foodType ?? "",
    quantity: d.quantity ?? "",
    unit: d.unit ?? "",
    people: d.people ?? "",
    area: d.area || user.area || "",
    address: d.address || (d.area ? "" : (user.address ?? "")),
    lat: !d.area && !d.address && user.lat !== null ? String(user.lat) : "",
    lng: !d.area && !d.address && user.lng !== null ? String(user.lng) : "",
    neededBy: d.neededInHours !== null ? toLocal(Date.now() + d.neededInHours * 3_600_000) : "",
    notes: d.notes ?? "",
    tzOffset: "0",
  };
}

const firstErrors = (errors: Record<string, string[] | undefined>) =>
  Object.values(errors)
    .map((e) => e?.[0])
    .filter(Boolean)
    .join("\n• ");

async function previewDonation(link: ChannelLink, user: User, text: string) {
  const draft = await readDonation(text);
  const missing = missingForDonation(draft);
  if (missing.length) {
    await setPending(link.id, { kind: "donation", text });
    return `Thanks! I still need: ${missing.join(", ")}.\nSend them in your own words (or NO to cancel).`;
  }
  const form = donationForm(draft, user);
  const parsed = donationSchema.safeParse(form);
  if (!parsed.success) {
    await setPending(link.id, { kind: "donation", text });
    return `Almost there. Please fix:\n• ${firstErrors(fieldErrors(parsed.error))}\nSend the corrected details (or NO to cancel).`;
  }
  await setPending(link.id, { kind: "donation", text }, form);
  const d = parsed.data;
  return [
    "Here’s your donation:",
    `• ${d.quantity} ${UNIT_SHORT[d.unit]} ${d.foodType} (${CATEGORY_LABEL[d.category]})`,
    `• ${CONDITION_LABEL[d.condition]}, prepared ${formatDateTime(d.preparedAt)}`,
    `• Best before ${formatDateTime(d.expiresAt)}`,
    `• Pickup from ${formatDateTime(d.pickupAt)} at ${d.pickupAddress}${draft.pickupAddress ? "" : " (your profile address)"}`,
    "Reply YES to post it, NO to cancel, or send corrections.",
  ].join("\n");
}

async function previewNeed(link: ChannelLink, user: User, text: string) {
  const draft = await readNeed(text);
  const missing = missingForNeed({ ...draft, area: draft.area || user.area });
  if (missing.length) {
    await setPending(link.id, { kind: "need", text });
    return `Thanks! I still need: ${missing.join(", ")}.\nSend them in your own words (or NO to cancel).`;
  }
  const form = needForm(draft, user);
  const parsed = needSchema.safeParse(form);
  if (!parsed.success) {
    await setPending(link.id, { kind: "need", text });
    return `Almost there. Please fix:\n• ${firstErrors(fieldErrors(parsed.error))}\nSend the corrected details (or NO to cancel).`;
  }
  await setPending(link.id, { kind: "need", text }, form);
  const n = parsed.data;
  return [
    "Here’s your food request:",
    `• ${n.quantity} ${UNIT_SHORT[n.unit]} ${n.foodType ?? (n.category ? CATEGORY_LABEL[n.category] : "any food")} for ${n.people} people`,
    `• ${n.area}${n.address ? `, ${n.address}` : ""}`,
    `• Needed by ${formatDateTime(n.neededBy)}`,
    "Reply YES to post it, NO to cancel, or send corrections.",
  ].join("\n");
}

/** YES: re-validates the stored form values (times may have passed) and creates the record. */
async function confirmPending(link: ChannelLink, user: User) {
  if (!link.pendingDraft || !link.pendingKind) return "There’s nothing waiting to post. Send DONATE or NEED with your details.";
  const values = JSON.parse(link.pendingDraft);
  if (link.pendingKind === "donation") {
    if (user.role !== "donor") return "Only donor accounts can post donations.";
    const parsed = donationSchema.safeParse(values);
    if (!parsed.success) return `That draft is no longer valid:\n• ${firstErrors(fieldErrors(parsed.error))}\nSend the details again.`;
    const id = await createDonation(user.id, parsed.data, null);
    await matchOpenNeeds();
    await setPending(link.id, null);
    return `Posted! We’ll message you when an NGO is matched and a volunteer is on the way.${appLink(`/donor/donations/${id}`)}`;
  }
  if (user.role !== "ngo" || user.status !== "active") return "Only verified NGO accounts can post food requests.";
  const parsed = needSchema.safeParse(values);
  if (!parsed.success) return `That draft is no longer valid:\n• ${firstErrors(fieldErrors(parsed.error))}\nSend the details again.`;
  const id = await createNeed(user.id, parsed.data);
  await setPending(link.id, null);
  return `Posted! We’ll message you when food is matched to your request.${appLink(`/ngo/requests/${id}`)}`;
}

/* ------------------------------------------------------------- status */

async function statusReply(user: User) {
  const db = await getDb();
  const owner = user.role === "donor" ? donations.donorId : user.role === "ngo" ? donations.ngoId : user.role === "volunteer" ? donations.volunteerId : null;
  if (!owner) return "Open FoodBridge to see platform alerts.";
  const rows = await db
    .select({ foodType: donations.foodType, status: donations.status, quantity: donations.quantity, unit: donations.unit })
    .from(donations)
    .where(and(eq(owner, user.id), inArray(donations.status, ACTIVE_STATUSES)))
    .orderBy(desc(donations.updatedAt))
    .limit(5);
  if (!rows.length) return "Nothing active right now.";
  return ["Your latest:", ...rows.map((r) => `• ${r.quantity} ${UNIT_SHORT[r.unit]} ${r.foodType}: ${STATUS_META[r.status].label}`)].join("\n");
}

/* ------------------------------------------------------------ inbound */

export type InboundMessage = { channel: ChatChannel; from: string; text: string };

/** Handles one incoming chat message and returns the reply text for n8n to send back. */
export async function handleInbound({ channel, from, text }: InboundMessage): Promise<string> {
  const message = text.trim();
  const [first = "", ...rest] = message.split(/\s+/);
  const command = first.toUpperCase().replace(/[^A-Z]/g, "");
  const body = rest.join(" ");

  if (limited(`${channel}:${from}`, 20, 60_000)) return "You’re sending messages quickly. Please wait a minute.";

  const db = await getDb();
  const [row] = await db
    .select({ link: channelLinks, user: users })
    .from(channelLinks)
    .innerJoin(users, eq(users.id, channelLinks.userId))
    .where(and(eq(channelLinks.channel, channel), eq(channelLinks.externalId, from), isNotNull(channelLinks.linkedAt)));

  if (!row) {
    if (command !== "LINK") return NOT_LINKED_REPLY(channel);
    if (limited(`link:${channel}:${from}`, 5, 15 * 60_000)) return "Too many tries. Please wait 15 minutes and get a new code.";
    const code = body.replace(/\D/g, "");
    const user = code.length === 6 ? await redeemCode(channel, from, code) : null;
    return user
      ? `Linked to ${user.organizationName ?? user.name}’s FoodBridge account. You’ll get important updates here.\n\n${CHAT_HELP[user.role]}`
      : "That code didn’t work or has expired. Get a new one in FoodBridge → Profile → Chat apps.";
  }

  const { link, user } = row;
  if (user.status === "suspended" || user.status === "deactivated") return "This FoodBridge account isn’t active. Please contact the FoodBridge team.";

  const pending: Pending | null =
    link.pendingKind && link.pendingText && link.pendingAt && link.pendingAt.getTime() > Date.now() - PENDING_HOURS * 3_600_000
      ? { kind: link.pendingKind, text: link.pendingText }
      : null;

  switch (command) {
    case "LINK":
      return `This ${CHAT_CHANNEL_LABEL[channel]} is already linked to your account.`;
    case "HELP":
    case "MENU":
    case "HI":
    case "HELLO":
    case "START":
      return CHAT_HELP[user.role];
    case "STOP":
    case "UNLINK":
      await unlinkChannel(user.id, channel);
      return `Unlinked. You won’t get FoodBridge messages on ${CHAT_CHANNEL_LABEL[channel]} any more.`;
    case "STATUS":
      return statusReply(user);
    case "NO":
    case "CANCEL":
      await setPending(link.id, null);
      return pending ? "Cancelled. Nothing was posted." : "Nothing to cancel.";
    case "YES":
    case "CONFIRM":
      return pending ? confirmPending(link, user) : "There’s nothing waiting to post. Send DONATE or NEED with your details.";
    case "DONATE":
      if (user.role !== "donor") return "Only donor accounts can post donations. Send HELP for what you can do.";
      if (!body) return CHAT_HELP.donor;
      return previewDonation(link, user, body);
    case "NEED":
    case "REQUEST":
      if (user.role !== "ngo") return "Only NGO accounts can post food requests. Send HELP for what you can do.";
      if (user.status !== "active") return "Your NGO is still being verified. You can post food requests once it’s approved.";
      if (!body) return CHAT_HELP.ngo;
      return previewNeed(link, user, body);
  }

  // Free text continues the draft in progress (e.g. the missing details).
  if (pending) {
    const combined = `${pending.text}\n${message}`;
    return pending.kind === "donation" ? previewDonation(link, user, combined) : previewNeed(link, user, combined);
  }
  return `Sorry, I didn’t understand that.\n\n${CHAT_HELP[user.role]}`;
}
