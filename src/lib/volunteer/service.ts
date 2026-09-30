import "server-only";

import { alias } from "drizzle-orm/pg-core";
import { and, asc, desc, eq, gt, inArray, isNull, lte, ne, notExists, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { donationEvents, donations, notifications, taskOffers, users, type DonationStatus } from "@/db/schema";
import { declineOffer, dispatchWaitingTasks, expireStaleOffers, withdrawVolunteerOffers } from "@/lib/dispatch/service";
import { expireOverdueDonations, mealsCounted, transitionDonation, transitionInTx } from "@/lib/donations/service";
import { distanceKm, toPoint, type LatLng } from "@/lib/geo";
import { CURRENT_TASK_STATUSES, DELIVERED_STATUSES, DISPATCH_RULES, PROOF_STEPS, REMINDER_MINUTES, type ProofStep } from "./meta";

type Photo = { data: Buffer; type: string } | null;

const donor = alias(users, "donor");
const ngo = alias(users, "ngo");
const mine = alias(taskOffers, "mine");

/**
 * Columns every task list shows: the delivery task. Food and quantity, where to collect it,
 * where to take it (the allocation snapshot, else the NGO's address), and by when.
 */
const taskColumns = {
  id: donations.id,
  foodType: donations.foodType,
  category: donations.category,
  quantity: donations.quantity,
  unit: donations.unit,
  mealsEstimate: donations.mealsEstimate,
  status: donations.status,
  pickupAt: donations.pickupAt,
  expiresAt: donations.expiresAt,
  deliverBy: donations.deliverBy,
  updatedAt: donations.updatedAt,
  pickupAddress: donations.pickupAddress,
  pickupLat: sql<number | null>`coalesce(${donations.pickupLat}, ${donor.lat})`,
  pickupLng: sql<number | null>`coalesce(${donations.pickupLng}, ${donor.lng})`,
  donorName: sql<string>`coalesce(${donor.organizationName}, ${donor.name})`,
  donorArea: donor.area,
  ngoName: sql<string | null>`coalesce(${ngo.organizationName}, ${ngo.name})`,
  ngoArea: ngo.area,
  ngoAddress: sql<string | null>`coalesce(${donations.deliveryAddress}, ${ngo.address})`,
  deliveryLat: sql<number | null>`coalesce(${donations.deliveryLat}, ${ngo.lat})`,
  deliveryLng: sql<number | null>`coalesce(${donations.deliveryLng}, ${ngo.lng})`,
  offerStatus: mine.status,
  offeredAt: mine.createdAt,
};

type TaskRow = { pickupLat: number | null; pickupLng: number | null; deliveryLat: number | null; deliveryLng: number | null };

/** Adds straight-line distances: volunteer → pickup, and pickup → delivery (donor → NGO). */
function withDistances<T extends TaskRow>(rows: T[], from: LatLng | null) {
  return rows.map((r) => {
    const pickup = toPoint(r.pickupLat, r.pickupLng);
    return {
      ...r,
      toPickupKm: distanceKm(from, pickup),
      deliveryKm: distanceKm(pickup, toPoint(r.deliveryLat, r.deliveryLng)),
    };
  });
}

export type TaskListItem = Awaited<ReturnType<typeof listVolunteerTasks>>[number];

/* ------------------------------------------------------------- dashboard */

export async function getVolunteerStats(volunteerId: string) {
  const db = await getDb();
  const [row] = await db
    .select({
      active: sql<number>`count(*) filter (where ${inArray(donations.status, CURRENT_TASK_STATUSES)})`.mapWith(Number),
      delivered: sql<number>`count(*) filter (where ${inArray(donations.status, DELIVERED_STATUSES)})`.mapWith(Number),
      meals: sql<number>`coalesce(sum(${mealsCounted}) filter (where ${inArray(donations.status, DELIVERED_STATUSES)}), 0)`.mapWith(
        Number,
      ),
    })
    .from(donations)
    .where(eq(donations.volunteerId, volunteerId));
  return row;
}

/* ----------------------------------------------------------------- lists */

/**
 * Pickups this volunteer may take: tasks assigned (offered) to them, then open tasks nobody is
 * being asked about right now, nearest first. A task offered to someone else stays hidden until
 * they answer, so two volunteers aren't racing for the same food.
 */
export async function listOpenTasks(volunteer: { id: string; lat: number | null; lng: number | null }, limit = 20) {
  const db = await getDb();
  const rows = await db
    .select(taskColumns)
    .from(donations)
    .innerJoin(donor, eq(donor.id, donations.donorId))
    .leftJoin(ngo, eq(ngo.id, donations.ngoId))
    .leftJoin(mine, and(eq(mine.donationId, donations.id), eq(mine.volunteerId, volunteer.id)))
    .where(
      and(
        eq(donations.status, "MATCHED"),
        isNull(donations.volunteerId),
        gt(donations.expiresAt, new Date()),
        or(
          eq(mine.status, "OFFERED"),
          notExists(
            db
              .select({ one: sql`1` })
              .from(taskOffers)
              .where(and(eq(taskOffers.donationId, donations.id), eq(taskOffers.status, "OFFERED"))),
          ),
        ),
      ),
    )
    .orderBy(asc(donations.pickupAt))
    .limit(50);
  return withDistances(rows, toPoint(volunteer.lat, volunteer.lng))
    .sort(
      (a, b) =>
        Number(b.offerStatus === "OFFERED") - Number(a.offerStatus === "OFFERED") ||
        (a.toPickupKm ?? Infinity) - (b.toPickupKm ?? Infinity) ||
        a.pickupAt.getTime() - b.pickupAt.getTime(),
    )
    .slice(0, limit);
}

/** The volunteer's own tasks: `current` = still to pick up or deliver, `completed` = finished or closed. */
export async function listVolunteerTasks(
  volunteer: { id: string; lat: number | null; lng: number | null },
  view: "current" | "completed",
  limit = 100,
) {
  const db = await getDb();
  const current = view === "current";
  const rows = await db
    .select(taskColumns)
    .from(donations)
    .innerJoin(donor, eq(donor.id, donations.donorId))
    .leftJoin(ngo, eq(ngo.id, donations.ngoId))
    .leftJoin(mine, and(eq(mine.donationId, donations.id), eq(mine.volunteerId, volunteer.id)))
    .where(
      and(
        eq(donations.volunteerId, volunteer.id),
        current
          ? inArray(donations.status, CURRENT_TASK_STATUSES)
          : inArray(donations.status, [...DELIVERED_STATUSES, "CANCELLED", "EXPIRED"]),
      ),
    )
    .orderBy(current ? asc(donations.pickupAt) : desc(donations.updatedAt))
    .limit(limit);
  return withDistances(rows, toPoint(volunteer.lat, volunteer.lng));
}

/* --------------------------------------------------------------- details */

/**
 * A task as seen by a volunteer. Visible while it's offered to them or open to anyone, or once
 * it is theirs. Donor and NGO phone numbers are shared only after the volunteer accepts.
 */
export async function getVolunteerTask(volunteer: { id: string; lat: number | null; lng: number | null }, donationId: string) {
  const db = await getDb();
  const [row] = await db
    .select({
      ...taskColumns,
      condition: donations.condition,
      preparedAt: donations.preparedAt,
      instructions: donations.instructions,
      mealsServed: donations.mealsServed,
      cancelReason: donations.cancelReason,
      hasImage: sql<boolean>`${donations.imageData} is not null`,
      volunteerId: donations.volunteerId,
      contactName: donations.contactName,
      contactPhone: donations.contactPhone,
      ngoContact: ngo.name,
      ngoPhone: ngo.phone,
      offeredElsewhere: sql<boolean>`exists (select 1 from ${taskOffers} o where o.donation_id = ${donations.id} and o.status = 'OFFERED' and o.volunteer_id <> ${volunteer.id})`,
    })
    .from(donations)
    .innerJoin(donor, eq(donor.id, donations.donorId))
    .leftJoin(ngo, eq(ngo.id, donations.ngoId))
    .leftJoin(mine, and(eq(mine.donationId, donations.id), eq(mine.volunteerId, volunteer.id)))
    .where(eq(donations.id, donationId))
    .limit(1);
  if (!row) return null;

  const isMine = row.volunteerId === volunteer.id;
  const offeredToMe = row.offerStatus === "OFFERED";
  const open = row.status === "MATCHED" && !row.volunteerId && row.expiresAt > new Date() && (offeredToMe || !row.offeredElsewhere);
  if (!isMine && !open) return null;

  const events = isMine
    ? await db
        .select({
          status: donationEvents.status,
          note: donationEvents.note,
          createdAt: donationEvents.createdAt,
          hasPhoto: sql<boolean>`${donationEvents.photoData} is not null`,
        })
        .from(donationEvents)
        .where(eq(donationEvents.donationId, donationId))
        .orderBy(donationEvents.createdAt)
    : [];
  const step = (status: DonationStatus) => events.findLast((e) => e.status === status) ?? null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { contactName, contactPhone, ngoContact, ngoPhone, offeredElsewhere, ...rest } = row;
  const [withKm] = withDistances([rest], toPoint(volunteer.lat, volunteer.lng));
  return {
    ...withKm,
    mine: isMine,
    open,
    offeredToMe,
    offerExpiresAt: offeredToMe && row.offeredAt ? new Date(row.offeredAt.getTime() + DISPATCH_RULES.offerMinutes * 60_000) : null,
    donorContact: isMine ? { name: contactName, phone: contactPhone } : null,
    ngoContactInfo: isMine && ngoContact ? { name: ngoContact, phone: ngoPhone } : null,
    assignedAt: step("ASSIGNED")?.createdAt ?? null,
    pickup: step("PICKED_UP"),
    transit: step("IN_TRANSIT"),
    delivery: step("DELIVERED"),
  };
}

export type VolunteerTask = NonNullable<Awaited<ReturnType<typeof getVolunteerTask>>>;

export async function canVolunteerSeeDonation(volunteer: { id: string; lat: number | null; lng: number | null }, donationId: string) {
  return (await getVolunteerTask(volunteer, donationId)) !== null;
}

/** Proof photo attached at pickup or delivery; only the assigned volunteer can fetch it. */
export async function getProofPhoto(volunteerId: string, donationId: string, step: ProofStep) {
  const db = await getDb();
  const [row] = await db
    .select({ data: donationEvents.photoData, type: donationEvents.photoType })
    .from(donationEvents)
    .innerJoin(donations, eq(donations.id, donationEvents.donationId))
    .where(
      and(
        eq(donationEvents.donationId, donationId),
        eq(donationEvents.status, PROOF_STEPS[step]),
        eq(donations.volunteerId, volunteerId),
      ),
    )
    .orderBy(desc(donationEvents.createdAt))
    .limit(1);
  return row?.data && row.type ? { data: row.data, type: row.type } : null;
}

/* ---------------------------------------------------------------- writes */

/**
 * Accepts a task that is assigned (offered) to this volunteer or open to anyone. Fails if someone
 * else took it first, it's being offered to another volunteer, or the food has expired.
 */
export async function acceptTask(volunteerId: string, donationId: string) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ expiresAt: donations.expiresAt })
      .from(donations)
      .where(
        and(
          eq(donations.id, donationId),
          isNull(donations.volunteerId),
          notExists(
            tx
              .select({ one: sql`1` })
              .from(taskOffers)
              .where(and(eq(taskOffers.donationId, donationId), eq(taskOffers.status, "OFFERED"), ne(taskOffers.volunteerId, volunteerId))),
          ),
        ),
      );
    if (!row || row.expiresAt <= new Date()) return false;
    return transitionInTx(tx, donationId, "ASSIGNED", { actorId: volunteerId, volunteerId });
  });
}

/** Declines a task assigned to this volunteer; it goes to the next nearest one. */
export function declineTask(volunteerId: string, donationId: string, reason: string | null) {
  return declineOffer(volunteerId, donationId, reason);
}

/** Hands an accepted task back before pickup (can't make it); it's offered to the next volunteer. */
export function releaseTask(volunteerId: string, donationId: string, reason: string | null) {
  return transitionDonation(donationId, "MATCHED", {
    actorId: volunteerId,
    restrictToVolunteer: volunteerId,
    releaseVolunteer: true,
    note: reason ? `Volunteer can’t make it: ${reason}` : "Volunteer can’t make it",
  });
}

export function confirmPickup(volunteerId: string, donationId: string, note: string | null, photo: Photo) {
  return transitionDonation(donationId, "PICKED_UP", {
    actorId: volunteerId,
    restrictToVolunteer: volunteerId,
    note: note ?? undefined,
    photo,
  });
}

/** The volunteer sets off for the NGO. */
export function startDelivery(volunteerId: string, donationId: string) {
  return transitionDonation(donationId, "IN_TRANSIT", { actorId: volunteerId, restrictToVolunteer: volunteerId });
}

export function confirmDelivery(volunteerId: string, donationId: string, note: string | null, photo: Photo) {
  return transitionDonation(donationId, "DELIVERED", {
    actorId: volunteerId,
    restrictToVolunteer: volunteerId,
    note: note ?? undefined,
    photo,
  });
}

/** Going offline hands waiting offers to the next volunteer; coming online picks up waiting tasks. */
export async function setAvailability(volunteerId: string, available: boolean) {
  const db = await getDb();
  await db
    .update(users)
    .set({ available, updatedAt: new Date() })
    .where(and(eq(users.id, volunteerId), eq(users.role, "volunteer")));
  if (available) await dispatchWaitingTasks();
  else await withdrawVolunteerOffers(volunteerId);
}

/**
 * Lazy housekeeping, run when a volunteer opens their pages (no cron needed):
 * - overdue donations are expired (which closes their tasks and notifies the volunteer)
 * - unanswered offers time out and move on to the next volunteer
 * - accepted tasks whose pickup is within REMINDER_MINUTES get a one-time pickup reminder
 */
export async function sweepVolunteerTasks(volunteerId: string) {
  await expireOverdueDonations();
  await expireStaleOffers();
  const db = await getDb();
  const due = await db
    .select({ id: donations.id, foodType: donations.foodType, pickupAddress: donations.pickupAddress })
    .from(donations)
    .where(
      and(
        eq(donations.volunteerId, volunteerId),
        eq(donations.status, "ASSIGNED"),
        lte(donations.pickupAt, new Date(Date.now() + REMINDER_MINUTES * 60_000)),
        notExists(
          db
            .select({ one: sql`1` })
            .from(notifications)
            .where(
              and(
                eq(notifications.donationId, donations.id),
                eq(notifications.userId, volunteerId),
                eq(notifications.type, "pickup_reminder"),
              ),
            ),
        ),
      ),
    );
  if (due.length) {
    await db.insert(notifications).values(
      due.map((d) => ({
        userId: volunteerId,
        donationId: d.id,
        type: "pickup_reminder" as const,
        message: `Pickup reminder: collect “${d.foodType}” from ${d.pickupAddress} soon.`,
      })),
    );
  }
}
