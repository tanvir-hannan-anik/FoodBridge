import "server-only";

import { and, count, desc, eq, inArray, isNull, isNotNull, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { CHAT_CHANNELS, channelLinks, notificationDeliveries, notifications, users, type NotificationType, type NotifyChannel } from "@/db/schema";
import { CHANNELS } from "./channels";
import { CHAT_CATEGORIES, EXTERNAL_CATEGORIES, NOTIFICATION_CATEGORY, type NotificationCategory } from "./meta";

/*
 * Event-based notifications. Every workflow event calls notify() (or inserts a notifications row
 * inside its transaction). That row IS the in-app notification. A database trigger then queues
 * one notification_deliveries row per outside channel the user opted into (email / SMS /
 * WhatsApp / Messenger), and flushOutbox() hands them to the channel adapters. Adding a real
 * provider later means implementing one adapter in channels.ts, with no change to any workflow.
 */

type DB = Awaited<ReturnType<typeof getDb>>;
type Conn = Pick<DB, "insert" | "select">;

export type NotifyLinks = { requestId?: string | null; needId?: string | null };

export async function notify(
  tx: Conn,
  userId: string,
  donationId: string | null,
  type: NotificationType,
  message: string,
  links: NotifyLinks = {},
) {
  await tx.insert(notifications).values({ userId, donationId, type, message, requestId: links.requestId ?? null, needId: links.needId ?? null });
}

/**
 * Alerts every active admin, at most once per donation and type (so a recurring sweep never
 * repeats itself). Only for things a person may need to step in on.
 */
export async function notifyAdmins(tx: Conn, donationId: string | null, message: string, type: NotificationType = "admin_alert") {
  const admins = await tx
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.role, "admin"),
        eq(users.status, "active"),
        donationId
          ? sql`not exists (select 1 from ${notifications} n where n.user_id = ${users.id} and n.donation_id = ${donationId} and n.type = ${type})`
          : undefined,
      ),
    );
  if (admins.length) await tx.insert(notifications).values(admins.map((a) => ({ userId: a.id, donationId, type, message })));
}

/* ----------------------------------------------------------------- reads */

export async function listNotifications(userId: string, opts: { unreadOnly?: boolean; category?: NotificationCategory; limit?: number } = {}) {
  const db = await getDb();
  const types = opts.category
    ? (Object.entries(NOTIFICATION_CATEGORY) as [NotificationType, NotificationCategory][]).filter(([, c]) => c === opts.category).map(([t]) => t)
    : null;
  return db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), opts.unreadOnly ? isNull(notifications.readAt) : undefined, types ? inArray(notifications.type, types) : undefined))
    .orderBy(desc(notifications.createdAt))
    .limit(opts.limit ?? 100);
}

export async function countUnread(userId: string) {
  const db = await getDb();
  const [row] = await db
    .select({ n: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return row.n;
}

/* ---------------------------------------------------------------- writes */

export async function markAllRead(userId: string) {
  const db = await getDb();
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}

/** Read ↔ unread for one of the user's own notifications. */
export async function setRead(userId: string, notificationId: string, read: boolean) {
  const db = await getDb();
  await db
    .update(notifications)
    .set({ readAt: read ? new Date() : null })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

/** Which outside channels this user wants. In-app is always on. */
export async function setNotifyChannels(userId: string, channels: NotifyChannel[]) {
  const db = await getDb();
  await db.update(users).set({ notifyChannels: channels, updatedAt: new Date() }).where(eq(users.id, userId));
}

/* ---------------------------------------------------------------- outbox */

const MAX_ATTEMPTS = 3;

/**
 * Sends queued outside-channel messages (part of housekeeping). Only important categories go
 * out (EXTERNAL_CATEGORIES); channels without a configured provider are marked SKIPPED, so
 * turning one on later only affects new messages.
 */
export async function flushOutbox(limit = 50) {
  const db = await getDb();
  const queued = await db
    .select({
      id: notificationDeliveries.id,
      channel: notificationDeliveries.channel,
      attempts: notificationDeliveries.attempts,
      type: notifications.type,
      message: notifications.message,
      donationId: notifications.donationId,
      createdAt: notifications.createdAt,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      chatId: channelLinks.externalId,
    })
    .from(notificationDeliveries)
    .innerJoin(notifications, eq(notifications.id, notificationDeliveries.notificationId))
    .innerJoin(users, eq(users.id, notificationDeliveries.userId))
    .leftJoin(
      channelLinks,
      and(eq(channelLinks.userId, notificationDeliveries.userId), sql`${channelLinks.channel} = ${notificationDeliveries.channel}`, isNotNull(channelLinks.linkedAt)),
    )
    .where(inArray(notificationDeliveries.status, ["PENDING", "FAILED"]))
    .orderBy(notificationDeliveries.createdAt)
    .limit(limit);

  let sent = 0;
  for (const q of queued) {
    if (q.attempts >= MAX_ATTEMPTS) continue;
    const channel = CHANNELS[q.channel];
    const category = NOTIFICATION_CATEGORY[q.type];
    const chat = (CHAT_CHANNELS as readonly string[]).includes(q.channel);
    const wanted = (chat ? CHAT_CATEGORIES : EXTERNAL_CATEGORIES).includes(category);
    if (!wanted || !channel?.isConfigured() || (chat && !q.chatId)) {
      const reason = !channel?.isConfigured() ? "Channel not connected yet" : !wanted ? "Not an important update" : "Chat app not linked";
      await db.update(notificationDeliveries).set({ status: "SKIPPED", lastError: reason }).where(eq(notificationDeliveries.id, q.id));
      continue;
    }
    try {
      await channel.send({
        to: { name: q.name, email: q.email, phone: q.phone, role: q.role, chatId: q.chatId },
        category,
        type: q.type,
        text: q.message,
        donationId: q.donationId,
        createdAt: q.createdAt,
      });
      await db.update(notificationDeliveries).set({ status: "SENT", sentAt: new Date(), attempts: q.attempts + 1, lastError: null }).where(eq(notificationDeliveries.id, q.id));
      sent++;
    } catch (error) {
      await db
        .update(notificationDeliveries)
        .set({ status: "FAILED", attempts: q.attempts + 1, lastError: error instanceof Error ? error.message.slice(0, 300) : "Send failed" })
        .where(eq(notificationDeliveries.id, q.id));
    }
  }
  return sent;
}

/** Old read notifications are trimmed so lists stay fast (history of unread items is kept). */
export async function pruneOldNotifications(days = 90) {
  const db = await getDb();
  await db.delete(notifications).where(and(isNotNull(notifications.readAt), lt(notifications.createdAt, new Date(Date.now() - days * 86_400_000))));
}
