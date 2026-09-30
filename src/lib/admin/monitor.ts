import "server-only";

import { alias } from "drizzle-orm/pg-core";
import { and, asc, count, desc, eq, gte, inArray, isNull, lt, lte, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { donationEvents, donations, foodNeeds, foodRequests, taskOffers, users, type DonationStatus } from "@/db/schema";
import { MONITOR_RULES } from "./meta";

/*
 * Operational monitoring for the admin dashboard: food that is stuck somewhere in the workflow.
 * Read-only; each item links to the donation (or NGO) page where the admin resolves it.
 */

const donor = alias(users, "donor");
const ngo = alias(users, "ngo");
const volunteer = alias(users, "volunteer");

const MIN = 60_000;
const HOUR = 60 * MIN;

/** When the donation entered its current status (its latest timeline event). */
const since = sql<Date>`(select max(${donationEvents.createdAt}) from ${donationEvents} where ${donationEvents.donationId} = ${donations.id})`.mapWith(
  (v: string | Date) => new Date(v),
);

async function stuckDonations(statuses: DonationStatus[], extra: SQL | undefined, order: "oldest" | "newest" = "oldest") {
  const db = await getDb();
  const where = and(inArray(donations.status, statuses), extra);
  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: donations.id,
        foodType: donations.foodType,
        status: donations.status,
        pickupAt: donations.pickupAt,
        expiresAt: donations.expiresAt,
        since,
        donorName: sql<string>`coalesce(${donor.organizationName}, ${donor.name})`,
        ngoName: sql<string | null>`coalesce(${ngo.organizationName}, ${ngo.name})`,
        volunteerName: volunteer.name,
        // Allocated but nobody is being asked: the task is open to every volunteer.
        openToAll: sql<boolean>`not exists (select 1 from ${taskOffers} where ${taskOffers.donationId} = ${donations.id} and ${taskOffers.status} = 'OFFERED')`,
      })
      .from(donations)
      .innerJoin(donor, eq(donor.id, donations.donorId))
      .leftJoin(ngo, eq(ngo.id, donations.ngoId))
      .leftJoin(volunteer, eq(volunteer.id, donations.volunteerId))
      .where(where)
      .orderBy(order === "oldest" ? asc(since) : desc(since))
      .limit(MONITOR_RULES.perGroup),
    db.select({ n: count() }).from(donations).where(where),
  ]);
  return { items: rows, total: total.n };
}

export type AttentionDonation = Awaited<ReturnType<typeof stuckDonations>>["items"][number];

/** Everything an admin may need to step in on, grouped by what's wrong. */
export async function getAttentionQueue(now = new Date()) {
  const r = MONITOR_RULES;
  const ago = (ms: number) => new Date(now.getTime() - ms);
  // Raw comparisons bind an ISO string (drivers differ on Date parameters inside sql``).
  const sinceBefore = (ms: number) => sql`${since} < ${ago(ms).toISOString()}::timestamptz`;

  const [waitingVolunteer, latePickup, stalled, unconfirmed, expired, urgentNeeds] = await Promise.all([
    stuckDonations(["MATCHED"], and(isNull(donations.volunteerId), sinceBefore(r.waitingVolunteerMinutes * MIN))),
    stuckDonations(["ASSIGNED"], lt(donations.pickupAt, ago(r.latePickupMinutes * MIN))),
    stuckDonations(["PICKED_UP", "IN_TRANSIT"], sinceBefore(r.stalledDeliveryHours * HOUR)),
    stuckDonations(["DELIVERED"], sinceBefore(r.unconfirmedHours * HOUR)),
    stuckDonations(["EXPIRED"], sql`${since} >= ${ago(r.expiredLookbackHours * HOUR).toISOString()}::timestamptz`, "newest"),
    listUrgentNeeds(now),
  ]);

  const groups = { waitingVolunteer, latePickup, stalled, unconfirmed };
  const open = Object.values(groups).reduce((n, g) => n + g.total, 0) + urgentNeeds.total;
  return { ...groups, expired, urgentNeeds, open };
}

/** Open NGO food requests needed soon that have nothing matched or accepted yet ("failed matches"). */
async function listUrgentNeeds(now: Date) {
  const db = await getDb();
  const where = and(
    eq(foodNeeds.status, "OPEN"),
    gte(foodNeeds.neededBy, now),
    lte(foodNeeds.neededBy, new Date(now.getTime() + MONITOR_RULES.urgentNeedHours * HOUR)),
    sql`not exists (select 1 from ${foodRequests} where ${foodRequests.needId} = ${foodNeeds.id} and ${foodRequests.status} in ('MATCHED', 'ACCEPTED'))`,
  );
  const [items, [total]] = await Promise.all([
    db
      .select({
        id: foodNeeds.id,
        quantity: foodNeeds.quantity,
        unit: foodNeeds.unit,
        people: foodNeeds.people,
        area: foodNeeds.area,
        neededBy: foodNeeds.neededBy,
        ngoId: ngo.id,
        ngoName: sql<string>`coalesce(${ngo.organizationName}, ${ngo.name})`,
      })
      .from(foodNeeds)
      .innerJoin(ngo, eq(ngo.id, foodNeeds.ngoId))
      .where(where)
      .orderBy(asc(foodNeeds.neededBy))
      .limit(MONITOR_RULES.perGroup),
    db.select({ n: count() }).from(foodNeeds).where(where),
  ]);
  return { items, total: total.n };
}
