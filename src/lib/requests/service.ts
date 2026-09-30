import "server-only";

import { alias } from "drizzle-orm/pg-core";
import { and, asc, desc, eq, gt, gte, ilike, inArray, isNull, lte, notExists, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { donations, foodNeeds, foodRequests, users, type FoodCategory, type FoodNeed, type Unit } from "@/db/schema";
import { mealsCounted, notify } from "@/lib/donations/service";
import { distanceKm, formatDistance, toPoint, type LatLng } from "@/lib/geo";
import { allocationFor, compareCandidates, MATCH_RULES, scoreCandidate } from "@/lib/matching/meta";
import { allocateInTx, rejectMatch } from "@/lib/matching/service";
import { needEditable, needProgress, needStage, type NeedAllocation } from "./meta";

export type NeedInput = {
  category: FoodCategory | null;
  foodType: string | null;
  quantity: number;
  unit: Unit;
  people: number;
  area: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  neededBy: Date;
  notes: string | null;
};

const donor = alias(users, "donor");

/* ----------------------------------------------------------------- reads */

/** Donations attached to these needs (system matches and accepted food), with their progress. */
async function loadAllocations(needIds: string[]) {
  if (!needIds.length) return [];
  const db = await getDb();
  return db
    .select({
      requestId: foodRequests.id,
      needId: foodRequests.needId,
      status: foodRequests.status,
      updatedAt: foodRequests.updatedAt,
      allocatedAt: foodRequests.allocatedAt,
      distanceKm: foodRequests.distanceKm,
      requestQuantity: foodRequests.quantity,
      requestPeople: foodRequests.people,
      donationId: donations.id,
      donationStatus: donations.status,
      foodType: donations.foodType,
      category: donations.category,
      quantity: donations.quantity,
      unit: donations.unit,
      meals: mealsCounted,
      expiresAt: donations.expiresAt,
      pickupAt: donations.pickupAt,
      pickupAddress: donations.pickupAddress,
      donorName: sql<string>`coalesce(${donor.organizationName}, ${donor.name})`,
      donorArea: donor.area,
    })
    .from(foodRequests)
    .innerJoin(donations, eq(donations.id, foodRequests.donationId))
    .innerJoin(donor, eq(donor.id, donations.donorId))
    .where(inArray(foodRequests.needId, needIds))
    .orderBy(desc(foodRequests.updatedAt));
}

type Allocation = Awaited<ReturnType<typeof loadAllocations>>[number];

function summarize(need: FoodNeed, allocations: Allocation[]) {
  const mine: NeedAllocation[] = allocations.filter((a) => a.needId === need.id);
  return {
    ...need,
    stage: needStage(need, mine),
    progress: needProgress(need.people, mine),
    editable: needEditable(need, mine),
  };
}

export async function listNeeds(ngoId: string) {
  const db = await getDb();
  const needs = await db.select().from(foodNeeds).where(eq(foodNeeds.ngoId, ngoId)).orderBy(desc(foodNeeds.createdAt)).limit(100);
  const allocations = await loadAllocations(needs.map((n) => n.id));
  return needs.map((n) => summarize(n, allocations));
}

export type NeedListItem = Awaited<ReturnType<typeof listNeeds>>[number];

export async function getNeed(ngoId: string, needId: string) {
  const db = await getDb();
  const [need] = await db
    .select()
    .from(foodNeeds)
    .where(and(eq(foodNeeds.id, needId), eq(foodNeeds.ngoId, ngoId)));
  if (!need) return null;
  const allocations = await loadAllocations([need.id]);
  return { ...summarize(need, allocations), allocations };
}

/* --------------------------------------------------------------- writes */

export async function createNeed(ngoId: string, input: NeedInput) {
  const db = await getDb();
  const [row] = await db.insert(foodNeeds).values({ ngoId, ...input }).returning({ id: foodNeeds.id });
  await matchOpenNeeds({ needId: row.id });
  return row.id;
}

/** Only while no food has been accepted for it. Clears any pending system match, then re-matches. */
export async function updateNeed(ngoId: string, needId: string, input: NeedInput) {
  const need = await getNeed(ngoId, needId);
  if (!need?.editable) return false;
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.update(foodNeeds).set({ ...input, updatedAt: new Date() }).where(eq(foodNeeds.id, needId));
    await tx
      .update(foodRequests)
      .set({ status: "CANCELLED", updatedAt: new Date() })
      .where(and(eq(foodRequests.needId, needId), eq(foodRequests.status, "MATCHED")));
  });
  await matchOpenNeeds({ needId });
  return true;
}

/**
 * Stops a request. `cancel` (before any food was accepted, or by an admin) marks it CANCELLED;
 * otherwise it's CLOSED ("we have enough"). Pending system matches are withdrawn either way.
 */
export async function endNeed(needId: string, how: "cancel" | "close", scope: { ngoId?: string } = {}) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(foodNeeds)
      .set({ status: how === "cancel" ? "CANCELLED" : "CLOSED", updatedAt: new Date() })
      .where(
        and(eq(foodNeeds.id, needId), eq(foodNeeds.status, "OPEN"), scope.ngoId ? eq(foodNeeds.ngoId, scope.ngoId) : undefined),
      )
      .returning({ id: foodNeeds.id, ngoId: foodNeeds.ngoId });
    if (!row) return null;
    await tx
      .update(foodRequests)
      .set({ status: "CANCELLED", updatedAt: new Date() })
      .where(and(eq(foodRequests.needId, needId), eq(foodRequests.status, "MATCHED")));
    return row;
  });
}

/**
 * The NGO (or an admin on its behalf) accepts a system match: the proposed quantity is allocated
 * to it, the pickup task is created, and every other request or match on that food is declined.
 * Returns an error message, or null on success.
 */
export async function acceptMatch(requestId: string, scope: { ngoId?: string; actorId: string }): Promise<string | null> {
  const db = await getDb();
  const error = await db.transaction((tx) =>
    allocateInTx(tx, requestId, {
      actorId: scope.actorId,
      from: "MATCHED",
      ngoId: scope.ngoId,
      note: scope.ngoId ? "Matched to the NGO’s food request" : "Match accepted by FoodBridge for the NGO",
    }),
  );
  // A split leaves a remainder other requests may want; a failure frees this request to try again.
  await matchOpenNeeds();
  return error;
}

/** The NGO rejects (passes on) a system match; we look for another one. */
export async function skipMatch(ngoId: string, requestId: string) {
  await rejectMatch(requestId, { ngoId });
  await matchOpenNeeds({ ngoId });
}

/* -------------------------------------------------------------- matching */

/**
 * Matches available donations to open NGO food requests. For each open request that still needs
 * food and has no match waiting for confirmation, it proposes the best donation by the rules in
 * lib/matching/meta.ts (hard filters, then a transparent score: earlier expiry, closer location,
 * suitable quantity). Requests needed soonest are served first, so results are deterministic.
 * Cheap enough to run inline: after a donation is posted, after a request changes, and when NGOs open their pages.
 */
export async function matchOpenNeeds(scope: { ngoId?: string; needId?: string } = {}) {
  const db = await getDb();
  const now = new Date();
  const open = await db
    .select({ need: foodNeeds, ngoLat: users.lat, ngoLng: users.lng })
    .from(foodNeeds)
    .innerJoin(users, eq(users.id, foodNeeds.ngoId))
    .where(
      and(
        eq(foodNeeds.status, "OPEN"),
        gt(foodNeeds.neededBy, now),
        eq(users.status, "active"),
        scope.ngoId ? eq(foodNeeds.ngoId, scope.ngoId) : undefined,
        scope.needId ? eq(foodNeeds.id, scope.needId) : undefined,
        // Skip needs already waiting on the NGO to confirm a match.
        notExists(
          db
            .select({ one: sql`1` })
            .from(foodRequests)
            .where(and(eq(foodRequests.needId, foodNeeds.id), eq(foodRequests.status, "MATCHED"))),
        ),
      ),
    )
    .orderBy(asc(foodNeeds.neededBy), asc(foodNeeds.createdAt));
  if (!open.length) return 0;

  const allocations = await loadAllocations(open.map((o) => o.need.id));
  let proposed = 0;
  for (const { need, ngoLat, ngoLng } of open) {
    const { remaining } = needProgress(need.people, allocations.filter((a) => a.needId === need.id));
    if (remaining <= 0) continue;
    // Where the food goes: the request's own pin, else the NGO's.
    const target = toPoint(need.lat, need.lng) ?? toPoint(ngoLat, ngoLng);
    if (await proposeBestDonation(need, remaining, target)) proposed++;
  }
  return proposed;
}

async function proposeBestDonation(need: FoodNeed, remaining: number, target: LatLng | null) {
  const db = await getDb();
  const now = new Date();
  const offered = alias(foodRequests, "offered");

  // Hard rules, in SQL: available (PENDING, so not expired, cancelled or allocated), fresh enough,
  // ready in time, right category, not waiting on another NGO, never tried with this NGO.
  const candidates = await db
    .select({
      id: donations.id,
      foodType: donations.foodType,
      quantity: donations.quantity,
      unit: donations.unit,
      meals: donations.mealsEstimate,
      expiresAt: donations.expiresAt,
      createdAt: donations.createdAt,
      pickupAddress: donations.pickupAddress,
      pickupLat: donations.pickupLat,
      pickupLng: donations.pickupLng,
      donorArea: donor.area,
      donorLat: donor.lat,
      donorLng: donor.lng,
      donorName: sql<string>`coalesce(${donor.organizationName}, ${donor.name})`,
    })
    .from(donations)
    .innerJoin(donor, eq(donor.id, donations.donorId))
    .where(
      and(
        eq(donations.status, "PENDING"),
        isNull(donations.safetyFlag),
        gt(donations.expiresAt, new Date(now.getTime() + MATCH_RULES.minFreshMinutes * 60_000)),
        lte(donations.pickupAt, need.neededBy),
        need.category ? eq(donations.category, need.category) : undefined,
        notExists(
          db
            .select({ one: sql`1` })
            .from(offered)
            .where(
              and(
                eq(offered.donationId, donations.id),
                or(eq(offered.status, "MATCHED"), eq(offered.ngoId, need.ngoId)),
              ),
            ),
        ),
      ),
    )
    .orderBy(asc(donations.expiresAt), asc(donations.createdAt))
    .limit(MATCH_RULES.candidateLimit);
  if (!candidates.length) return false;

  // Ranking, in code: the weighted score from lib/matching/meta.ts.
  const place = need.area.split(",")[0].trim().toLowerCase();
  const [best] = candidates
    .map((c) => {
      const km = distanceKm(toPoint(c.pickupLat, c.pickupLng) ?? toPoint(c.donorLat, c.donorLng), target);
      const sameArea = !!place && [c.donorArea, c.pickupAddress].some((t) => t?.toLowerCase().includes(place));
      return { ...c, km, match: scoreCandidate({ expiresAt: c.expiresAt, meals: c.meals, distanceKm: km, sameArea }, remaining, now) };
    })
    .filter((c) => c.km === null || c.km <= MATCH_RULES.maxDistanceKm)
    .sort(compareCandidates);
  if (!best) return false;

  // Propose only what the request still needs; a larger donation is split when it's accepted.
  const alloc = allocationFor(best, remaining);
  const [row] = await db
    .insert(foodRequests)
    .values({
      donationId: best.id,
      ngoId: need.ngoId,
      needId: need.id,
      status: "MATCHED",
      quantity: alloc.quantity,
      people: Math.max(1, Math.min(remaining, alloc.meals)),
      preferredAt: best.expiresAt < need.neededBy ? best.expiresAt : need.neededBy,
      distanceKm: best.km,
    })
    .onConflictDoNothing()
    .returning({ id: foodRequests.id });
  if (!row) return false;
  const away = formatDistance(best.km);
  await notify(
    db,
    need.ngoId,
    best.id,
    "request_matched",
    `We found food for your request: “${best.foodType}” from ${best.donorName} (~${alloc.meals} meals${away ? `, ${away} away` : ""}). Accept or reject it.`,
    { requestId: row.id, needId: need.id },
  );
  return true;
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/* ----------------------------------------------------------------- admin */

export type NeedFilters = { q?: string; stage?: string; location?: string; from?: Date; to?: Date };

/** Every NGO food request, newest first, with its roll-up stage and progress. */
export async function listAllNeeds(filters: NeedFilters = {}, limit = 100) {
  const db = await getDb();
  const ngo = alias(users, "ngo");
  const q = filters.q?.trim();
  const rows = await db
    .select({ need: foodNeeds, ngoName: sql<string>`coalesce(${ngo.organizationName}, ${ngo.name})` })
    .from(foodNeeds)
    .innerJoin(ngo, eq(ngo.id, foodNeeds.ngoId))
    .where(
      and(
        q
          ? or(
              ilike(ngo.organizationName, `%${escapeLike(q)}%`),
              ilike(ngo.name, `%${escapeLike(q)}%`),
              ilike(foodNeeds.foodType, `%${escapeLike(q)}%`),
            )
          : undefined,
        filters.location ? ilike(foodNeeds.area, `%${escapeLike(filters.location)}%`) : undefined,
        filters.from ? gte(foodNeeds.createdAt, filters.from) : undefined,
        filters.to ? lte(foodNeeds.createdAt, filters.to) : undefined,
      ),
    )
    .orderBy(desc(foodNeeds.createdAt))
    .limit(limit);
  const allocations = await loadAllocations(rows.map((r) => r.need.id));
  const items = rows.map((r) => ({ ...summarize(r.need, allocations), ngoName: r.ngoName }));
  return filters.stage ? items.filter((i) => i.stage === filters.stage) : items;
}

/** Count of requests nobody has food for yet (for the admin dashboard). */
export async function countPendingNeeds() {
  const items = await listAllNeeds({ stage: "pending" }, 500);
  return items.length;
}

