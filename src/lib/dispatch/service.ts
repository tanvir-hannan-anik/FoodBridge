import "server-only";

import { alias } from "drizzle-orm/pg-core";
import { and, asc, eq, inArray, isNull, lt, ne, notExists, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { donations, liveLocations, notifications, taskOffers, users } from "@/db/schema";
import type { Tx } from "@/lib/donations/service";
import { distanceKm, formatDistance, toPoint } from "@/lib/geo";
import { notifyAdmins } from "@/lib/notifications/service";
import { DISPATCH_RULES } from "@/lib/volunteer/meta";

/*
 * Volunteer dispatch. When a donation is allocated (MATCHED) its pickup task is offered to ONE
 * volunteer at a time, nearest first. They accept or decline; no answer within
 * DISPATCH_RULES.offerMinutes counts as a decline. When nobody suitable is left, the task opens
 * to every available volunteer (first to accept takes it), so food is never stranded.
 *
 * This module writes notifications itself (instead of importing donations/service) because
 * transitionInTx calls it: donations → dispatch, never the other way round.
 */

type DB = Awaited<ReturnType<typeof getDb>>;
type Conn = Tx | DB;

const donor = alias(users, "donor");
const ngo = alias(users, "ngo");

/**
 * Offers the task to the next-best volunteer, unless it's already waiting on someone.
 * Returns the volunteer it's waiting on, or null if the task is open to everyone (or not a task).
 */
export async function offerNextVolunteer(tx: Conn, donationId: string): Promise<string | null> {
  const [d] = await tx
    .select({
      status: donations.status,
      volunteerId: donations.volunteerId,
      expiresAt: donations.expiresAt,
      foodType: donations.foodType,
      // No pin on the donation: fall back to the donor's profile pin.
      pickupLat: sql<number | null>`coalesce(${donations.pickupLat}, ${donor.lat})`,
      pickupLng: sql<number | null>`coalesce(${donations.pickupLng}, ${donor.lng})`,
      pickupAddress: donations.pickupAddress,
      donorArea: donor.area,
      ngoName: sql<string | null>`coalesce(${ngo.organizationName}, ${ngo.name})`,
    })
    .from(donations)
    .innerJoin(donor, eq(donor.id, donations.donorId))
    .leftJoin(ngo, eq(ngo.id, donations.ngoId))
    .where(eq(donations.id, donationId));
  if (!d || d.status !== "MATCHED" || d.volunteerId || d.expiresAt <= new Date()) return null;

  const [waiting] = await tx
    .select({ volunteerId: taskOffers.volunteerId })
    .from(taskOffers)
    .where(and(eq(taskOffers.donationId, donationId), eq(taskOffers.status, "OFFERED")))
    .limit(1);
  if (waiting) return waiting.volunteerId;

  const candidates = await tx
    .select({
      id: users.id,
      lat: users.lat,
      lng: users.lng,
      area: users.area,
      activeTasks: sql<number>`(select count(*) from ${donations} t where t.volunteer_id = ${users.id} and t.status in ('ASSIGNED','PICKED_UP','IN_TRANSIT'))`.mapWith(
        Number,
      ),
    })
    .from(users)
    .where(
      and(
        eq(users.role, "volunteer"),
        eq(users.status, "active"),
        eq(users.available, true),
        // Never offer the same task to the same person twice (declined, timed out, handed back…).
        notExists(
          tx
            .select({ one: sql`1` })
            .from(taskOffers)
            .where(and(eq(taskOffers.donationId, donationId), eq(taskOffers.volunteerId, users.id))),
        ),
      ),
    );

  const pickup = toPoint(d.pickupLat, d.pickupLng);
  const place = (d.donorArea ?? "").split(",")[0].trim().toLowerCase();
  const ranked = candidates
    .filter((v) => v.activeTasks < DISPATCH_RULES.maxActiveTasks)
    .map((v) => {
      const km = distanceKm(pickup, toPoint(v.lat, v.lng));
      const sameArea = !!place && (v.area ?? "").toLowerCase().includes(place);
      // Unknown distance: rank a same-area volunteer as if ~5 km away, anyone else ~12 km.
      return { ...v, km, rank: km ?? (sameArea ? 5 : 12) };
    })
    .filter((v) => v.km === null || v.km <= DISPATCH_RULES.maxDistanceKm)
    .sort((a, b) => a.rank - b.rank || a.activeTasks - b.activeTasks || a.id.localeCompare(b.id));

  const next = ranked[0];
  if (next) {
    const [offer] = await tx
      .insert(taskOffers)
      .values({ donationId, volunteerId: next.id, distanceKm: next.km })
      .onConflictDoNothing()
      .returning({ id: taskOffers.id });
    if (offer) {
      const away = formatDistance(next.km);
      await tx.insert(notifications).values({
        userId: next.id,
        donationId,
        type: "task_assigned",
        message: `New task assigned to you: pick up “${d.foodType}”${away ? ` (${away} away)` : ""} and take it to ${
          d.ngoName ?? "the NGO"
        }. Please accept or decline within ${DISPATCH_RULES.offerMinutes} minutes.`,
      });
      return next.id;
    }
  }

  await openToEveryone(tx, donationId, d.foodType);
  return null;
}

/** Nobody suitable accepted in turn: tell every available volunteer (once) that anyone may take it. */
async function openToEveryone(tx: Conn, donationId: string, foodType: string) {
  const [sent] = await tx
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.donationId, donationId), eq(notifications.type, "task_available")))
    .limit(1);
  if (sent) return;
  // Nobody nearby said yes: worth a person's attention.
  await notifyAdmins(tx, donationId, `No nearby volunteer accepted the pickup of “${foodType}”. It’s now open to every volunteer.`);
  const volunteers = await tx
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.role, "volunteer"),
        eq(users.status, "active"),
        eq(users.available, true),
        notExists(
          tx
            .select({ one: sql`1` })
            .from(taskOffers)
            .where(
              and(
                eq(taskOffers.donationId, donationId),
                eq(taskOffers.volunteerId, users.id),
                inArray(taskOffers.status, ["DECLINED", "RELEASED"]),
              ),
            ),
        ),
      ),
    );
  if (!volunteers.length) return;
  await tx.insert(notifications).values(
    volunteers.map((v) => ({
      userId: v.id,
      donationId,
      type: "task_available" as const,
      message: `Open pickup: “${foodType}” still needs a volunteer. Accept it if you can help.`,
    })),
  );
}

/** Records who took the task (offered or from the open pool) and withdraws any other open offer. */
export async function onTaskAccepted(tx: Conn, donationId: string, volunteerId: string) {
  const now = new Date();
  await tx
    .insert(taskOffers)
    .values({ donationId, volunteerId, status: "ACCEPTED", respondedAt: now })
    .onConflictDoUpdate({
      target: [taskOffers.donationId, taskOffers.volunteerId],
      set: { status: "ACCEPTED", respondedAt: now },
    });
  await tx
    .update(taskOffers)
    .set({ status: "WITHDRAWN", respondedAt: now })
    .where(and(eq(taskOffers.donationId, donationId), eq(taskOffers.status, "OFFERED"), ne(taskOffers.volunteerId, volunteerId)));
}

/** The volunteer handed the task back (or an admin took it away): never offer it to them again. */
export async function onTaskReleased(tx: Conn, donationId: string, volunteerId: string, note?: string) {
  await tx
    .update(taskOffers)
    .set({ status: "RELEASED", respondedAt: new Date(), note: note ?? null })
    .where(and(eq(taskOffers.donationId, donationId), eq(taskOffers.volunteerId, volunteerId)));
  await tx.delete(liveLocations).where(and(eq(liveLocations.donationId, donationId), eq(liveLocations.userId, volunteerId)));
}

/** The task ended (delivered, cancelled, expired or unmatched): withdraw offers and stop live sharing. */
export async function closeTask(tx: Conn, donationId: string) {
  await tx
    .update(taskOffers)
    .set({ status: "WITHDRAWN", respondedAt: new Date() })
    .where(and(eq(taskOffers.donationId, donationId), eq(taskOffers.status, "OFFERED")));
  await tx.delete(liveLocations).where(eq(liveLocations.donationId, donationId));
}

/** An assigned volunteer declines. The task moves on to the next nearest volunteer. */
export async function declineOffer(volunteerId: string, donationId: string, reason: string | null) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(taskOffers)
      .set({ status: "DECLINED", respondedAt: new Date(), note: reason })
      .where(and(eq(taskOffers.donationId, donationId), eq(taskOffers.volunteerId, volunteerId), eq(taskOffers.status, "OFFERED")))
      .returning({ id: taskOffers.id });
    if (!row) return false;
    await offerNextVolunteer(tx, donationId);
    return true;
  });
}

/** Offers nobody answered in time count as declined; the task moves on. */
export async function expireStaleOffers() {
  const db = await getDb();
  const cutoff = new Date(Date.now() - DISPATCH_RULES.offerMinutes * 60_000);
  const stale = await db
    .update(taskOffers)
    .set({ status: "EXPIRED", respondedAt: new Date() })
    .where(and(eq(taskOffers.status, "OFFERED"), lt(taskOffers.createdAt, cutoff)))
    .returning({ donationId: taskOffers.donationId, volunteerId: taskOffers.volunteerId });
  for (const s of stale) {
    await db.insert(notifications).values({
      userId: s.volunteerId,
      donationId: s.donationId,
      type: "task_declined",
      message: `A pickup offered to you was passed to another volunteer because there was no reply in ${DISPATCH_RULES.offerMinutes} minutes.`,
    });
    await db.transaction((tx) => offerNextVolunteer(tx, s.donationId));
  }
  return stale.length;
}

/** A volunteer went offline or was blocked: their waiting offers move to the next volunteer. */
export async function withdrawVolunteerOffers(volunteerId: string) {
  const db = await getDb();
  const withdrawn = await db
    .update(taskOffers)
    .set({ status: "WITHDRAWN", respondedAt: new Date(), note: "Volunteer unavailable" })
    .where(and(eq(taskOffers.volunteerId, volunteerId), eq(taskOffers.status, "OFFERED")))
    .returning({ donationId: taskOffers.donationId });
  for (const w of withdrawn) await db.transaction((tx) => offerNextVolunteer(tx, w.donationId));
}

/**
 * Allocated tasks that aren't waiting on anyone get their next offer: covers volunteers who came
 * online after the task opened and tasks created before dispatch existed. Part of housekeeping.
 */
export async function dispatchWaitingTasks() {
  const db = await getDb();
  const waiting = await db
    .select({ id: donations.id })
    .from(donations)
    .where(
      and(
        eq(donations.status, "MATCHED"),
        isNull(donations.volunteerId),
        notExists(
          db
            .select({ one: sql`1` })
            .from(taskOffers)
            .where(and(eq(taskOffers.donationId, donations.id), eq(taskOffers.status, "OFFERED"))),
        ),
      ),
    )
    .orderBy(asc(donations.pickupAt))
    .limit(100);
  for (const w of waiting) await db.transaction((tx) => offerNextVolunteer(tx, w.id));
}

/** Who the task has been offered to, in order (admin history). */
export async function listTaskOffers(donationId: string) {
  const db = await getDb();
  return db
    .select({
      id: taskOffers.id,
      status: taskOffers.status,
      distanceKm: taskOffers.distanceKm,
      note: taskOffers.note,
      createdAt: taskOffers.createdAt,
      respondedAt: taskOffers.respondedAt,
      volunteerId: users.id,
      volunteerName: users.name,
    })
    .from(taskOffers)
    .innerJoin(users, eq(users.id, taskOffers.volunteerId))
    .where(eq(taskOffers.donationId, donationId))
    .orderBy(asc(taskOffers.createdAt));
}

/** Whether an allocated task is currently waiting on a specific volunteer's answer (for donor/NGO status). */
export async function hasPendingOffer(donationId: string) {
  const db = await getDb();
  const [row] = await db
    .select({ id: taskOffers.id })
    .from(taskOffers)
    .where(and(eq(taskOffers.donationId, donationId), eq(taskOffers.status, "OFFERED")))
    .limit(1);
  return !!row;
}

