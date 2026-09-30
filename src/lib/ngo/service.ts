import "server-only";

import { alias } from "drizzle-orm/pg-core";
import { and, asc, count, desc, eq, gt, ilike, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { donationEvents, donations, foodNeeds, foodRequests, users, type FoodCategory } from "@/db/schema";
import { mealsCounted, notify, transitionDonation } from "@/lib/donations/service";
import { allocateInTx } from "@/lib/matching/service";
import { UNIT_SHORT } from "@/lib/donations/meta";
import { requestStage, type Stage } from "./meta";

export type AvailableFilters = { location?: string; category?: FoodCategory; within?: number };

/* ------------------------------------------------------------ find food */

/** Donations still open for requests (PENDING, not expired), soonest-expiring first. */
export async function listAvailableDonations(ngoId: string, filters: AvailableFilters = {}, limit = 60) {
  const db = await getDb();
  const donor = alias(users, "donor");
  const mine = alias(foodRequests, "mine");
  const now = new Date();
  const location = filters.location?.trim();

  return db
    .select({
      id: donations.id,
      foodType: donations.foodType,
      category: donations.category,
      quantity: donations.quantity,
      unit: donations.unit,
      mealsEstimate: donations.mealsEstimate,
      expiresAt: donations.expiresAt,
      pickupAt: donations.pickupAt,
      pickupAddress: donations.pickupAddress,
      status: donations.status,
      donorName: sql<string>`coalesce(${donor.organizationName}, ${donor.name})`,
      donorArea: donor.area,
      myRequest: mine.status,
    })
    .from(donations)
    .innerJoin(donor, eq(donor.id, donations.donorId))
    .leftJoin(mine, and(eq(mine.donationId, donations.id), eq(mine.ngoId, ngoId)))
    .where(
      and(
        eq(donations.status, "PENDING"),
        gt(donations.expiresAt, now),
        isNull(donations.safetyFlag),
        filters.category ? eq(donations.category, filters.category) : undefined,
        filters.within ? lte(donations.expiresAt, new Date(now.getTime() + filters.within * 3_600_000)) : undefined,
        location
          ? or(ilike(donations.pickupAddress, `%${escapeLike(location)}%`), ilike(donor.area, `%${escapeLike(location)}%`))
          : undefined,
      ),
    )
    .orderBy(asc(donations.expiresAt))
    .limit(limit);
}

export type AvailableDonation = Awaited<ReturnType<typeof listAvailableDonations>>[number];

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/* ------------------------------------------------------------- dashboard */

export async function getNgoStats(ngoId: string) {
  const db = await getDb();
  const [[available], [requests], [received], [needs]] = await Promise.all([
    db
      .select({ n: count() })
      .from(donations)
      .where(and(eq(donations.status, "PENDING"), gt(donations.expiresAt, new Date()), isNull(donations.safetyFlag))),
    db
      .select({ n: count() })
      .from(foodRequests)
      .innerJoin(donations, eq(donations.id, foodRequests.donationId))
      .where(
        and(
          eq(foodRequests.ngoId, ngoId),
          or(
            inArray(foodRequests.status, ["PENDING", "MATCHED"]),
            and(eq(foodRequests.status, "ACCEPTED"), inArray(donations.status, ["MATCHED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"])),
          ),
        ),
      ),
    db
      .select({
        received: count(),
        meals: sql<number>`coalesce(sum(${mealsCounted}) filter (where ${donations.status} = 'COMPLETED'), 0)`.mapWith(
          Number,
        ),
      })
      .from(donations)
      .where(and(eq(donations.ngoId, ngoId), inArray(donations.status, ["DELIVERED", "COMPLETED"]))),
    db
      .select({ n: count() })
      .from(foodNeeds)
      .where(and(eq(foodNeeds.ngoId, ngoId), eq(foodNeeds.status, "OPEN"), gt(foodNeeds.neededBy, new Date()))),
  ]);
  return {
    available: available.n,
    activeRequests: requests.n,
    openNeeds: needs.n,
    received: received.received,
    meals: received.meals,
  };
}

/* -------------------------------------------------------------- requests */

export async function listNgoRequests(ngoId: string) {
  const db = await getDb();
  const donor = alias(users, "donor");
  const rows = await db
    .select({
      id: foodRequests.id,
      needId: foodRequests.needId,
      status: foodRequests.status,
      quantity: foodRequests.quantity,
      people: foodRequests.people,
      preferredAt: foodRequests.preferredAt,
      createdAt: foodRequests.createdAt,
      donationId: donations.id,
      foodType: donations.foodType,
      category: donations.category,
      unit: donations.unit,
      donationStatus: donations.status,
      expiresAt: donations.expiresAt,
      donorName: sql<string>`coalesce(${donor.organizationName}, ${donor.name})`,
    })
    .from(foodRequests)
    .innerJoin(donations, eq(donations.id, foodRequests.donationId))
    .innerJoin(donor, eq(donor.id, donations.donorId))
    .where(eq(foodRequests.ngoId, ngoId))
    .orderBy(desc(foodRequests.updatedAt))
    .limit(200);
  return rows.map((r) => ({ ...r, stage: requestStage(r.status, r.donationStatus) as Stage }));
}

export type NgoRequestItem = Awaited<ReturnType<typeof listNgoRequests>>[number];

type RequestInput = { quantity: number; people: number; preferredAt: Date; notes: string | null };

/** Returns an error message, or null on success. */
export async function createRequest(ngoId: string, donationId: string, input: RequestInput): Promise<string | null> {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [donation] = await tx
      .select({
        status: donations.status,
        expiresAt: donations.expiresAt,
        quantity: donations.quantity,
        unit: donations.unit,
        foodType: donations.foodType,
        donorId: donations.donorId,
        safetyFlag: donations.safetyFlag,
      })
      .from(donations)
      .where(eq(donations.id, donationId));
    if (!donation || donation.status !== "PENDING" || donation.expiresAt <= new Date() || donation.safetyFlag) {
      return "This donation is no longer available.";
    }
    if (input.quantity > donation.quantity) {
      return `Only ${donation.quantity} ${UNIT_SHORT[donation.unit]} are available.`;
    }
    if (input.preferredAt >= donation.expiresAt) return "Preferred time must be before the food’s best-before time.";

    // Re-requesting is allowed only after the NGO withdrew its earlier request or passed on a system match.
    const [row] = await tx
      .insert(foodRequests)
      .values({ donationId, ngoId, ...input })
      .onConflictDoUpdate({
        target: [foodRequests.donationId, foodRequests.ngoId],
        set: { ...input, needId: null, status: "PENDING", createdAt: new Date(), updatedAt: new Date() },
        setWhere: inArray(foodRequests.status, ["CANCELLED", "SKIPPED"]),
      })
      .returning({ id: foodRequests.id });
    if (!row) return "You’ve already requested this donation.";

    const [ngo] = await tx
      .select({ name: sql<string>`coalesce(${users.organizationName}, ${users.name})` })
      .from(users)
      .where(eq(users.id, ngoId));
    await notify(tx, ngoId, donationId, "request_submitted", `Request sent for “${donation.foodType}”. We’ll tell you when the donor responds.`, {
      requestId: row.id,
    });
    await notify(
      tx,
      donation.donorId,
      donationId,
      "request_received",
      `${ngo.name} requested “${donation.foodType}” to feed ${input.people} people. Review and accept it.`,
      { requestId: row.id },
    );
    return null;
  });
}

export async function cancelRequest(ngoId: string, requestId: string) {
  const db = await getDb();
  await db
    .update(foodRequests)
    .set({ status: "CANCELLED", updatedAt: new Date() })
    .where(and(eq(foodRequests.id, requestId), eq(foodRequests.ngoId, ngoId), eq(foodRequests.status, "PENDING")));
}

/**
 * Donor accepts one NGO's request: the requested quantity is allocated to it (a larger donation is
 * split and the rest stays available), the pickup task is created, and other requests are declined.
 * Returns an error message, or null on success.
 */
export async function acceptRequest(donorId: string, requestId: string): Promise<string | null> {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [request] = await tx
      .select({ donationId: foodRequests.donationId, ngoId: foodRequests.ngoId, foodType: donations.foodType })
      .from(foodRequests)
      .innerJoin(donations, eq(donations.id, foodRequests.donationId))
      .where(and(eq(foodRequests.id, requestId), eq(foodRequests.status, "PENDING"), eq(donations.donorId, donorId)));
    if (!request) return "This request is no longer open.";

    const error = await allocateInTx(tx, requestId, { actorId: donorId, from: "PENDING", donorId });
    if (error) return error;
    await notify(tx, request.ngoId, request.donationId, "request_accepted", `The donor accepted your request for “${request.foodType}”.`, { requestId });
    return null;
  });
}

export async function declineRequest(donorId: string, requestId: string) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [request] = await tx
      .select({ id: foodRequests.id, ngoId: foodRequests.ngoId, donationId: donations.id, foodType: donations.foodType })
      .from(foodRequests)
      .innerJoin(donations, eq(donations.id, foodRequests.donationId))
      .where(and(eq(foodRequests.id, requestId), eq(foodRequests.status, "PENDING"), eq(donations.donorId, donorId)));
    if (!request) return false;
    await tx.update(foodRequests).set({ status: "DECLINED", updatedAt: new Date() }).where(eq(foodRequests.id, requestId));
    await notify(tx, request.ngoId, request.donationId, "request_declined", `The donor couldn’t accept your request for “${request.foodType}”.`);
    return true;
  });
}

/** NGO confirms food arrived (useful if the volunteer didn't mark it delivered). */
export function confirmReceived(ngoId: string, donationId: string) {
  return transitionDonation(donationId, "DELIVERED", { actorId: ngoId, restrictToNgo: ngoId, note: "Confirmed by NGO" });
}

export function completeDonation(ngoId: string, donationId: string, mealsServed: number) {
  return transitionDonation(donationId, "COMPLETED", {
    actorId: ngoId,
    restrictToNgo: ngoId,
    mealsServed,
    note: `${mealsServed} meals served`,
  });
}

/** Completed distributions: what arrived, when, and how many meals the NGO served from it. */
export async function listDistributions(ngoId: string, limit = 20) {
  const db = await getDb();
  const donor = alias(users, "donor");
  return db
    .select({
      id: donations.id,
      foodType: donations.foodType,
      category: donations.category,
      quantity: donations.quantity,
      unit: donations.unit,
      meals: mealsCounted,
      completedAt: donations.updatedAt,
      donorName: sql<string>`coalesce(${donor.organizationName}, ${donor.name})`,
    })
    .from(donations)
    .innerJoin(donor, eq(donor.id, donations.donorId))
    .where(and(eq(donations.ngoId, ngoId), eq(donations.status, "COMPLETED")))
    .orderBy(desc(donations.updatedAt))
    .limit(limit);
}

/* --------------------------------------------------------------- details */

/**
 * A donation as seen by an NGO. Visible if it's still open for requests, or the NGO has
 * requested it / is matched with it. Donor contact details only once matched.
 */
export async function getNgoDonation(ngoId: string, donationId: string) {
  const db = await getDb();
  const donor = alias(users, "donor");
  const volunteer = alias(users, "volunteer");
  const [row] = await db
    .select({
      id: donations.id,
      foodType: donations.foodType,
      category: donations.category,
      quantity: donations.quantity,
      unit: donations.unit,
      mealsEstimate: donations.mealsEstimate,
      mealsServed: donations.mealsServed,
      condition: donations.condition,
      preparedAt: donations.preparedAt,
      expiresAt: donations.expiresAt,
      pickupAt: donations.pickupAt,
      pickupAddress: donations.pickupAddress,
      pickupLat: sql<number | null>`coalesce(${donations.pickupLat}, ${donor.lat})`,
      pickupLng: sql<number | null>`coalesce(${donations.pickupLng}, ${donor.lng})`,
      contactName: donations.contactName,
      contactPhone: donations.contactPhone,
      instructions: donations.instructions,
      hasImage: sql<boolean>`${donations.imageData} is not null`,
      status: donations.status,
      ngoId: donations.ngoId,
      deliveryAddress: donations.deliveryAddress,
      deliverBy: donations.deliverBy,
      safetyFlag: donations.safetyFlag,
      createdAt: donations.createdAt,
      donorName: sql<string>`coalesce(${donor.organizationName}, ${donor.name})`,
      donorType: donor.donorType,
      donorArea: donor.area,
      volunteerName: volunteer.name,
      volunteerPhone: volunteer.phone,
    })
    .from(donations)
    .innerJoin(donor, eq(donor.id, donations.donorId))
    .leftJoin(volunteer, eq(volunteer.id, donations.volunteerId))
    .where(eq(donations.id, donationId))
    .limit(1);
  if (!row) return null;

  const [request] = await db
    .select()
    .from(foodRequests)
    .where(and(eq(foodRequests.donationId, donationId), eq(foodRequests.ngoId, ngoId)));

  const matchedToMe = row.ngoId === ngoId;
  if (!matchedToMe && !request && row.status !== "PENDING") return null;

  const events = await db
    .select({ status: donationEvents.status, note: donationEvents.note, createdAt: donationEvents.createdAt })
    .from(donationEvents)
    .where(eq(donationEvents.donationId, donationId))
    .orderBy(donationEvents.createdAt);

  const { contactName, contactPhone, volunteerName, volunteerPhone, ...rest } = row;
  return {
    ...rest,
    matchedToMe,
    contact: matchedToMe ? { name: contactName, phone: contactPhone } : null,
    volunteer: matchedToMe && volunteerName ? { name: volunteerName, phone: volunteerPhone } : null,
    request: request ?? null,
    events: matchedToMe ? events : events.filter((e) => e.status === "PENDING"),
  };
}

export async function canNgoSeeDonation(ngoId: string, donationId: string) {
  return (await getNgoDonation(ngoId, donationId)) !== null;
}
