import "server-only";

import { and, asc, desc, eq, gte, inArray, notInArray, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/db";
import { chatOrders, donations, users, type ChatOrderStatus } from "@/db/schema";
import { distanceKm, toPoint } from "@/lib/geo";
import { notify } from "@/lib/notifications/service";
import { ACTIVE_CHAT_STATUSES, CHAT_ORDER_RULES, OPEN_SOURCE_STATUS, SOURCE_STATUS_FOR } from "./meta";
import { claimInSource, fetchInbox, inboxConfigured, setSourceStatus, type InboxRow } from "./supabase";

/* ---------------------------------------------------------------- sync */

export type SyncState = { configured: boolean; ok: boolean; syncedAt: Date | null };

const state = globalThis as unknown as {
  __foodbridgeChatSync?: { last: number; ok: boolean; at: Date | null; running?: Promise<void> };
};

const isOpen = (r: Pick<InboxRow, "source" | "sourceStatus">) => !r.sourceStatus || r.sourceStatus === OPEN_SOURCE_STATUS[r.source];

/**
 * Copies new and changed chat messages from Supabase into `chat_orders`, at most every
 * `CHAT_ORDER_RULES.syncSeconds` per process. Supabase decides only whether a waiting order is
 * still waiting (taken or deleted there → CLOSED, reopened there → NEW); once an NGO has assigned
 * it, FoodBridge owns the status and writes it back. Never throws: a failed sync keeps the last copy.
 */
export async function syncChatOrders({ force = false } = {}): Promise<SyncState> {
  if (!inboxConfigured()) return { configured: false, ok: false, syncedAt: null };
  const s = (state.__foodbridgeChatSync ??= { last: 0, ok: true, at: null });
  if (!s.running && (force || Date.now() - s.last >= CHAT_ORDER_RULES.syncSeconds * 1000)) {
    s.last = Date.now();
    s.running = pull()
      .then(() => {
        s.ok = true;
        s.at = new Date();
      })
      .catch((error) => {
        s.ok = false;
        console.error("[chat-orders] sync failed:", error instanceof Error ? error.message : error);
      })
      .finally(() => {
        s.running = undefined;
      });
  }
  if (s.running) await s.running;
  return { configured: true, ok: s.ok, syncedAt: s.at };
}

async function pull() {
  const rows = await fetchInbox(CHAT_ORDER_RULES.syncLimit);
  const db = await getDb();
  const now = new Date();

  if (rows.length) {
    await db
      .insert(chatOrders)
      .values(rows.map((r) => ({ ...r, status: (isOpen(r) ? "NEW" : "CLOSED") as ChatOrderStatus, syncedAt: now })))
      .onConflictDoUpdate({
        target: [chatOrders.source, chatOrders.externalId],
        set: {
          name: sql.raw("excluded.name"),
          phone: sql.raw("excluded.phone"),
          location: sql.raw("excluded.location"),
          food: sql.raw("excluded.food"),
          quantity: sql.raw("excluded.quantity"),
          goodFor: sql.raw("excluded.good_for"),
          place: sql.raw("excluded.place"),
          timeText: sql.raw("excluded.time_text"),
          sourceStatus: sql.raw("excluded.source_status"),
          syncedAt: sql.raw("excluded.synced_at"),
          status: sql.raw(`CASE
            WHEN chat_orders.push_pending THEN chat_orders.status
            WHEN chat_orders.status IN ('NEW','CLOSED') AND chat_orders.ngo_id IS NULL THEN excluded.status
            ELSE chat_orders.status END`),
        },
      });
  }

  // Waiting orders deleted in Supabase. Only rows inside the window we read can be judged.
  for (const source of ["donation", "request"] as const) {
    const ids = rows.filter((r) => r.source === source).map((r) => r.externalId);
    const floor = ids.length < CHAT_ORDER_RULES.syncLimit ? 0 : Math.min(...ids);
    await db
      .update(chatOrders)
      .set({ status: "CLOSED", updatedAt: now })
      .where(
        and(
          eq(chatOrders.source, source),
          eq(chatOrders.status, "NEW"),
          eq(chatOrders.pushPending, false),
          gte(chatOrders.externalId, floor),
          ids.length ? notInArray(chatOrders.externalId, ids) : undefined,
        ),
      );
  }

  // Status changes that didn't reach Supabase earlier.
  const pending = await db.select({ id: chatOrders.id }).from(chatOrders).where(eq(chatOrders.pushPending, true));
  for (const p of pending) await pushStatus(p.id);
}

/** Writes an order's status back to Supabase. Best effort: on failure it stays pending for the next sync. */
async function pushStatus(orderId: string) {
  const db = await getDb();
  const [o] = await db
    .select({ source: chatOrders.source, externalId: chatOrders.externalId, status: chatOrders.status })
    .from(chatOrders)
    .where(and(eq(chatOrders.id, orderId), eq(chatOrders.pushPending, true)));
  if (!o) return;
  const status = SOURCE_STATUS_FOR[o.status];
  try {
    if (status) await setSourceStatus(o.source, o.externalId, status);
    await db
      .update(chatOrders)
      .set({ pushPending: false, sourceStatus: status ?? undefined })
      .where(and(eq(chatOrders.id, orderId), eq(chatOrders.status, o.status)));
  } catch (error) {
    console.error("[chat-orders] status write-back failed:", error instanceof Error ? error.message : error);
  }
}

/* --------------------------------------------------------------- lists */

const volunteer = alias(users, "volunteer");
const ngo = alias(users, "ngo");

const orderColumns = {
  id: chatOrders.id,
  source: chatOrders.source,
  name: chatOrders.name,
  phone: chatOrders.phone,
  location: chatOrders.location,
  food: chatOrders.food,
  quantity: chatOrders.quantity,
  goodFor: chatOrders.goodFor,
  place: chatOrders.place,
  timeText: chatOrders.timeText,
  receivedAt: chatOrders.receivedAt,
  status: chatOrders.status,
  assignedAt: chatOrders.assignedAt,
  pickedUpAt: chatOrders.pickedUpAt,
  deliveredAt: chatOrders.deliveredAt,
};

/**
 * Everything the NGO page shows: offers waiting for someone to take them, the offers this NGO
 * assigned (with the volunteer's contact), and requests NGOs sent over chat (open ones first).
 */
export async function listChatOrdersForNgo(ngoId: string) {
  const db = await getDb();
  const [waiting, mine, requests] = await Promise.all([
    db
      .select(orderColumns)
      .from(chatOrders)
      .where(and(eq(chatOrders.source, "donation"), eq(chatOrders.status, "NEW")))
      .orderBy(desc(chatOrders.receivedAt))
      .limit(100),
    db
      .select({ ...orderColumns, volunteerId: chatOrders.volunteerId, volunteerName: volunteer.name, volunteerPhone: volunteer.phone })
      .from(chatOrders)
      .leftJoin(volunteer, eq(volunteer.id, chatOrders.volunteerId))
      .where(and(eq(chatOrders.ngoId, ngoId), inArray(chatOrders.status, ["ASSIGNED", "PICKED_UP", "DELIVERED"])))
      .orderBy(sql`${chatOrders.status} = 'DELIVERED'`, desc(chatOrders.updatedAt))
      .limit(100),
    db
      .select(orderColumns)
      .from(chatOrders)
      .where(eq(chatOrders.source, "request"))
      .orderBy(sql`${chatOrders.status} <> 'NEW'`, desc(chatOrders.receivedAt))
      .limit(100),
  ]);
  return { waiting, mine, requests };
}

export type NgoChatOrders = Awaited<ReturnType<typeof listChatOrdersForNgo>>;
export type ChatOrderItem = NgoChatOrders["waiting"][number];
export type AssignedChatOrder = NgoChatOrders["mine"][number];

/** A volunteer's chat orders: current ones first, then the latest deliveries. */
export async function listChatOrdersForVolunteer(volunteerId: string) {
  const db = await getDb();
  return db
    .select({
      ...orderColumns,
      ngoName: sql<string>`coalesce(${ngo.organizationName}, ${ngo.name})`,
      ngoPhone: ngo.phone,
      ngoAddress: ngo.address,
      ngoArea: ngo.area,
      ngoLat: ngo.lat,
      ngoLng: ngo.lng,
    })
    .from(chatOrders)
    .leftJoin(ngo, eq(ngo.id, chatOrders.ngoId))
    .where(and(eq(chatOrders.volunteerId, volunteerId), inArray(chatOrders.status, ["ASSIGNED", "PICKED_UP", "DELIVERED"])))
    .orderBy(sql`${chatOrders.status} = 'DELIVERED'`, desc(chatOrders.updatedAt))
    .limit(30);
}

export type VolunteerChatOrder = Awaited<ReturnType<typeof listChatOrdersForVolunteer>>[number];

/** Counts for the volunteer and NGO dashboards. */
export async function countActiveChatOrders(by: { volunteerId?: string; ngoId?: string }) {
  const db = await getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(chatOrders)
    .where(
      and(
        inArray(chatOrders.status, ACTIVE_CHAT_STATUSES),
        by.volunteerId ? eq(chatOrders.volunteerId, by.volunteerId) : undefined,
        by.ngoId ? eq(chatOrders.ngoId, by.ngoId) : undefined,
      ),
    );
  return row?.n ?? 0;
}

/** Volunteers an NGO can hand a chat order to: verified and switched to Available, nearest to the NGO first. */
export async function listChatVolunteerChoices(from: { lat: number | null; lng: number | null }) {
  const db = await getDb();
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      area: users.area,
      available: users.available,
      lat: users.lat,
      lng: users.lng,
      activeTasks: sql<number>`(select count(*) from ${donations} t where t.volunteer_id = ${users.id} and t.status in ('ASSIGNED','PICKED_UP','IN_TRANSIT'))
        + (select count(*) from ${chatOrders} c where c.volunteer_id = ${users.id} and c.status in ('ASSIGNED','PICKED_UP'))`.mapWith(Number),
    })
    .from(users)
    .where(and(eq(users.role, "volunteer"), eq(users.status, "active"), eq(users.available, true)))
    .orderBy(asc(users.name));
  const origin = toPoint(from.lat, from.lng);
  return rows
    .map(({ lat, lng, ...v }) => ({ ...v, km: distanceKm(origin, toPoint(lat, lng)) }))
    .sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9) || a.activeTasks - b.activeTasks)
    .slice(0, 50);
}

/* ------------------------------------------------------------ workflow */

type Actor = { id: string; name: string };
const food = (o: { food: string | null }) => o.food?.trim() || "food";

/**
 * A verified NGO hands a waiting chat offer to a volunteer (or, before pickup, swaps the
 * volunteer on one it assigned). A waiting offer is claimed in Supabase first, so the chat bot
 * and other NGOs can't hand it out again.
 */
export async function assignChatOrder(ngoUser: Actor, orderId: string, volunteerId: string): Promise<true | string> {
  const db = await getDb();
  const [v] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, volunteerId), eq(users.role, "volunteer"), eq(users.status, "active"), eq(users.available, true)));
  if (!v) return "Choose a verified volunteer who is available right now.";

  try {
    return await db.transaction(async (tx): Promise<true | string> => {
      const [o] = await tx
        .select()
        .from(chatOrders)
        .where(
          and(
            eq(chatOrders.id, orderId),
            eq(chatOrders.source, "donation"),
            or(eq(chatOrders.status, "NEW"), and(eq(chatOrders.status, "ASSIGNED"), eq(chatOrders.ngoId, ngoUser.id))),
          ),
        )
        .for("update");
      if (!o) return "This order was already taken or is no longer waiting.";
      if (o.volunteerId === volunteerId) return "This volunteer already has this order.";

      if (o.status === "NEW") {
        const claimed = await claimInSource(o.source, o.externalId, OPEN_SOURCE_STATUS[o.source], SOURCE_STATUS_FOR.ASSIGNED!);
        if (!claimed) {
          await tx.update(chatOrders).set({ status: "CLOSED", updatedAt: new Date() }).where(eq(chatOrders.id, o.id));
          return "This food was already taken or withdrawn through chat.";
        }
      }

      const now = new Date();
      await tx
        .update(chatOrders)
        .set({ status: "ASSIGNED", ngoId: ngoUser.id, volunteerId, assignedAt: now, sourceStatus: SOURCE_STATUS_FOR.ASSIGNED, updatedAt: now })
        .where(eq(chatOrders.id, o.id));
      await notify(
        tx,
        volunteerId,
        null,
        "chat_order_assigned",
        `${ngoUser.name} assigned you a chat order: pick up “${food(o)}” from ${o.name?.trim() || "the shop"}.`,
      );
      if (o.volunteerId) {
        await notify(tx, o.volunteerId, null, "chat_order_update", `You’re no longer needed for the chat order “${food(o)}”.`);
      }
      return true;
    });
  } catch (error) {
    console.error("[chat-orders] assign failed:", error instanceof Error ? error.message : error);
    return "We couldn’t reach the chat inbox. Please try again.";
  }
}

/** Puts an order back in the inbox (and back to "available" in Supabase). */
async function reopen(orderId: string, where: ReturnType<typeof and>, notice: (o: { food: string | null; ngoId: string | null; volunteerId: string | null }) => [string | null, string] | null) {
  const db = await getDb();
  const done = await db.transaction(async (tx) => {
    const [o] = await tx
      .select({ food: chatOrders.food, ngoId: chatOrders.ngoId, volunteerId: chatOrders.volunteerId })
      .from(chatOrders)
      .where(and(eq(chatOrders.id, orderId), eq(chatOrders.status, "ASSIGNED"), where))
      .for("update");
    if (!o) return false;
    await tx
      .update(chatOrders)
      .set({ status: "NEW", ngoId: null, volunteerId: null, assignedAt: null, pushPending: true, updatedAt: new Date() })
      .where(eq(chatOrders.id, orderId));
    const n = notice(o);
    if (n?.[0]) await notify(tx, n[0], null, "chat_order_update", n[1]);
    return true;
  });
  if (done) await pushStatus(orderId);
  return done;
}

/** The NGO cancels an assignment before pickup; the volunteer is told not to go. */
export function unassignChatOrder(ngoUser: Actor, orderId: string) {
  return reopen(orderId, eq(chatOrders.ngoId, ngoUser.id), (o) => [
    o.volunteerId,
    `${ngoUser.name} cancelled the chat order “${food(o)}”. You don’t need to pick it up.`,
  ]);
}

/** The volunteer can't make it (before pickup). The NGO can assign someone else. */
export function handBackChatOrder(volunteerUser: Actor, orderId: string) {
  return reopen(orderId, eq(chatOrders.volunteerId, volunteerUser.id), (o) => [
    o.ngoId,
    `${volunteerUser.name} can’t pick up the chat order “${food(o)}”. It’s back in Chat orders for you to assign again.`,
  ]);
}

/** Volunteer collected the food from the shop. */
export async function confirmChatPickup(volunteerId: string, orderId: string) {
  const db = await getDb();
  const now = new Date();
  const [o] = await db
    .update(chatOrders)
    .set({ status: "PICKED_UP", pickedUpAt: now, pushPending: true, updatedAt: now })
    .where(and(eq(chatOrders.id, orderId), eq(chatOrders.volunteerId, volunteerId), eq(chatOrders.status, "ASSIGNED")))
    .returning({ food: chatOrders.food, ngoId: chatOrders.ngoId });
  if (!o) return false;
  if (o.ngoId) await notify(db, o.ngoId, null, "chat_order_update", `“${food(o)}” from a chat order has been picked up and is on its way to you.`);
  await pushStatus(orderId);
  return true;
}

/**
 * Food reached the NGO: confirmed by the volunteer after pickup, or by the NGO itself (also when
 * the volunteer forgot to confirm the pickup).
 */
export async function confirmChatDelivery(user: { id: string; role: "ngo" | "volunteer" }, orderId: string) {
  const db = await getDb();
  const now = new Date();
  const mine =
    user.role === "volunteer"
      ? and(eq(chatOrders.volunteerId, user.id), eq(chatOrders.status, "PICKED_UP"))
      : and(eq(chatOrders.ngoId, user.id), inArray(chatOrders.status, ["ASSIGNED", "PICKED_UP"]));
  const [o] = await db
    .update(chatOrders)
    .set({ status: "DELIVERED", deliveredAt: now, pickedUpAt: sql`coalesce(${chatOrders.pickedUpAt}, ${now})`, pushPending: true, updatedAt: now })
    .where(and(eq(chatOrders.id, orderId), mine))
    .returning({ food: chatOrders.food, ngoId: chatOrders.ngoId, volunteerId: chatOrders.volunteerId });
  if (!o) return false;
  if (user.role === "volunteer" && o.ngoId) {
    await notify(db, o.ngoId, null, "chat_order_update", `“${food(o)}” from a chat order was delivered to you.`);
  } else if (user.role === "ngo" && o.volunteerId) {
    await notify(db, o.volunteerId, null, "chat_order_update", `The NGO confirmed it received “${food(o)}”. Thank you!`);
  }
  await pushStatus(orderId);
  return true;
}

/** A suspended or deactivated NGO/volunteer gives back chat orders not yet picked up. */
export async function releaseChatOrdersOf(userId: string, role: "ngo" | "volunteer") {
  const db = await getDb();
  const held = await db
    .select({ id: chatOrders.id })
    .from(chatOrders)
    .where(and(eq(role === "ngo" ? chatOrders.ngoId : chatOrders.volunteerId, userId), eq(chatOrders.status, "ASSIGNED")));
  for (const h of held) {
    await reopen(h.id, undefined, (o) =>
      role === "ngo"
        ? [o.volunteerId, `The chat order “${food(o)}” was cancelled. You don’t need to pick it up.`]
        : [o.ngoId, `The volunteer for the chat order “${food(o)}” is no longer available. It’s back in Chat orders for you to assign again.`],
    );
  }
}

