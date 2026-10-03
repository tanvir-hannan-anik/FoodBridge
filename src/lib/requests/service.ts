import "server-only";

import { alias } from "drizzle-orm/pg-core";
import { and, asc, desc, eq, gt, gte, ilike, inArray, isNull, lte, notExists, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { donations, foodNeeds, foodRequests, needResponses, users, type FoodCategory, type FoodNeed, type Unit } from "@/db/schema";
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
  await notifyDonorsOfNeed(row.id);
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

/* ------------------------------------------------- donors answer NGO requests */

const ngo = alias(users, "ngo");

/**
 * Open NGO food requests a donor can help with: still needing meals, not past their time, from
 * verified NGOs, and within MATCH_RULES.maxDistanceKm of the donor when both are pinned (unpinned
 * ones are still shown). Nearest first, then soonest. Includes the donor's own reply, if any.
 */
export async function listOpenNeedsForDonor(donor: { id: string; lat: number | null; lng: number | null }, limit = 30) {
  const db = await getDb();
  const rows = await db
    .select({
      need: foodNeeds,
      ngoName: sql<string>`coalesce(${ngo.organizationName}, ${ngo.name})`,
      ngoLat: ngo.lat,
      ngoLng: ngo.lng,
      myMessage: needResponses.message,
      myDonationId: needResponses.donationId,
      replies: sql<number>`(select count(*)::int from need_responses r where r.need_id = ${foodNeeds.id})`,
    })
    .from(foodNeeds)
    .innerJoin(ngo, eq(ngo.id, foodNeeds.ngoId))
    .leftJoin(needResponses, and(eq(needResponses.needId, foodNeeds.id), eq(needResponses.donorId, donor.id)))
    .where(and(eq(foodNeeds.status, "OPEN"), gt(foodNeeds.neededBy, new Date()), eq(ngo.status, "active")))
    .orderBy(asc(foodNeeds.neededBy))
    .limit(200);
  const allocations = await loadAllocations(rows.map((r) => r.need.id));
  const home = toPoint(donor.lat, donor.lng);
  return rows
    .map(({ need, ngoName, ngoLat, ngoLng, myMessage, myDonationId, replies }) => ({
      ...summarize(need, allocations),
      ngoName,
      myMessage,
      myDonationId,
      replies,
      km: distanceKm(home, toPoint(need.lat, need.lng) ?? toPoint(ngoLat, ngoLng)),
    }))
    .filter((n) => n.progress.remaining > 0 && (n.km === null || n.km <= MATCH_RULES.maxDistanceKm))
    .sort((a, b) => (a.km ?? 99) - (b.km ?? 99) || a.neededBy.getTime() - b.neededBy.getTime())
    .slice(0, limit);
}

export type OpenNeedForDonor = Awaited<ReturnType<typeof listOpenNeedsForDonor>>[number];

/** One open request from a verified NGO, for pre-filling the donation form ("post food for this request"). */
export async function getOpenNeed(needId: string) {
  const db = await getDb();
  const [row] = await db
    .select({ need: foodNeeds, ngoName: sql<string>`coalesce(${ngo.organizationName}, ${ngo.name})`, ngoLat: ngo.lat, ngoLng: ngo.lng })
    .from(foodNeeds)
    .innerJoin(ngo, eq(ngo.id, foodNeeds.ngoId))
    .where(and(eq(foodNeeds.id, needId), eq(foodNeeds.status, "OPEN"), gt(foodNeeds.neededBy, new Date()), eq(ngo.status, "active")));
  if (!row) return null;
  const allocations = await loadAllocations([needId]);
  return { ...summarize(row.need, allocations), ngoName: row.ngoName, target: toPoint(row.need.lat, row.need.lng) ?? toPoint(row.ngoLat, row.ngoLng) };
}

/** A donor's reply to an open request. One per donor and request (a new reply replaces the old); the NGO is told. */
export async function respondToNeed(donorId: string, needId: string, message: string): Promise<string | null> {
  const need = await getOpenNeed(needId);
  if (!need) return "This request is no longer open.";
  const db = await getDb();
  const [me] = await db.select({ name: sql<string>`coalesce(${users.organizationName}, ${users.name})` }).from(users).where(eq(users.id, donorId));
  await db.transaction(async (tx) => {
    await tx
      .insert(needResponses)
      .values({ needId, donorId, message })
      .onConflictDoUpdate({ target: [needResponses.needId, needResponses.donorId], set: { message, updatedAt: new Date() } });
    await notify(tx, need.ngoId, null, "need_response", `${me?.name ?? "A donor"} replied to your request “${need.foodType || "Any food"}”: “${message}”`, { needId });
  });
  return null;
}

/** Donor replies on one of the NGO's own requests, newest first. */
export async function listNeedResponses(ngoId: string, needId: string) {
  const db = await getDb();
  return db
    .select({
      id: needResponses.id,
      message: needResponses.message,
      updatedAt: needResponses.updatedAt,
      donationId: needResponses.donationId,
      donorName: sql<string>`coalesce(${donor.organizationName}, ${donor.name})`,
      donorArea: donor.area,
    })
    .from(needResponses)
    .innerJoin(foodNeeds, eq(foodNeeds.id, needResponses.needId))
    .innerJoin(donor, eq(donor.id, needResponses.donorId))
    .where(and(eq(needResponses.needId, needId), eq(foodNeeds.ngoId, ngoId)))
    .orderBy(desc(needResponses.updatedAt));
}

/**
 * The donor posted food "for" a request: it's proposed to that NGO straight away (MATCHED, so the
 * NGO confirms it exactly like a system match, then a volunteer is offered the pickup). The donor's
 * choice replaces any system match still waiting on that request. Returns false (normal matching
 * then applies) when the food doesn't fit: ready after the needed-by time, not fresh enough, or
 * paused for a safety check.
 */
export async function proposeDonationToNeed(donorId: string, donationId: string, needId: string) {
  const need = await getOpenNeed(needId);
  if (!need || need.progress.remaining <= 0) return false;
  const db = await getDb();
  const now = new Date();
  const [food] = await db
    .select({
      id: donations.id,
      foodType: donations.foodType,
      quantity: donations.quantity,
      unit: donations.unit,
      meals: donations.mealsEstimate,
      expiresAt: donations.expiresAt,
      pickupLat: donations.pickupLat,
      pickupLng: donations.pickupLng,
      donorLat: donor.lat,
      donorLng: donor.lng,
      donorName: sql<string>`coalesce(${donor.organizationName}, ${donor.name})`,
    })
    .from(donations)
    .innerJoin(donor, eq(donor.id, donations.donorId))
    .where(
      and(
        eq(donations.id, donationId),
        eq(donations.donorId, donorId),
        eq(donations.status, "PENDING"),
        isNull(donations.safetyFlag),
        gt(donations.expiresAt, new Date(now.getTime() + MATCH_RULES.minFreshMinutes * 60_000)),
        lte(donations.pickupAt, need.neededBy),
      ),
    );
  if (!food) return false;

  const alloc = allocationFor(food, need.progress.remaining);
  const km = distanceKm(toPoint(food.pickupLat, food.pickupLng) ?? toPoint(food.donorLat, food.donorLng), need.target);
  return db.transaction(async (tx) => {
    // Only one match waits on a request at a time.
    await tx
      .update(foodRequests)
      .set({ status: "CANCELLED", updatedAt: now })
      .where(and(eq(foodRequests.needId, needId), eq(foodRequests.status, "MATCHED")));
    const [row] = await tx
      .insert(foodRequests)
      .values({
        donationId: food.id,
        ngoId: need.ngoId,
        needId,
        status: "MATCHED",
        quantity: alloc.quantity,
        people: Math.max(1, Math.min(need.progress.remaining, alloc.meals)),
        preferredAt: food.expiresAt < need.neededBy ? food.expiresAt : need.neededBy,
        distanceKm: km,
      })
      .onConflictDoNothing()
      .returning({ id: foodRequests.id });
    if (!row) return false;
    await tx
      .insert(needResponses)
      .values({ needId, donorId, message: "I posted food for this request.", donationId: food.id })
      .onConflictDoUpdate({ target: [needResponses.needId, needResponses.donorId], set: { donationId: food.id, updatedAt: now } });
    await notify(
      tx,
      need.ngoId,
      food.id,
      "request_matched",
      `${food.donorName} posted food for your request: “${food.foodType}” (~${alloc.meals} meals). Accept or reject it.`,
      { requestId: row.id, needId },
    );
    return true;
  });
}

/**
 * Tells verified donors near a new request that an NGO needs food, so they don't have to keep
 * checking the site (linked WhatsApp/Messenger chats get it too). At most 40 donors: pinned ones
 * within MATCH_RULES.maxDistanceKm (nearest first), else those whose area mentions the request's.
 */
export async function notifyDonorsOfNeed(needId: string) {
  const need = await getOpenNeed(needId);
  if (!need) return 0;
  const db = await getDb();
  const place = need.area.split(",")[0].trim().toLowerCase();
  const donors = await db
    .select({ id: users.id, lat: users.lat, lng: users.lng, area: users.area, address: users.address })
    .from(users)
    .where(and(eq(users.role, "donor"), eq(users.status, "active")));
  const nearby = donors
    .map((d) => ({ ...d, km: distanceKm(toPoint(d.lat, d.lng), need.target) }))
    .filter((d) => (d.km !== null ? d.km <= MATCH_RULES.maxDistanceKm : !!place && [d.area, d.address].some((t) => t?.toLowerCase().includes(place))))
    .sort((a, b) => (a.km ?? 99) - (b.km ?? 99))
    .slice(0, 40);
  if (!nearby.length) return 0;
  const message = `${need.ngoName} needs ${need.foodType || "food"} for ${need.people} people in ${need.area}. Can you help?`;
  await db.transaction(async (tx) => {
    for (const d of nearby) await notify(tx, d.id, null, "need_posted", message, { needId });
  });
  return nearby.length;
}

