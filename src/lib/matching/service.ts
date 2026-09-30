import "server-only";

import { alias } from "drizzle-orm/pg-core";
import { and, desc, eq, inArray, lte, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { donationEvents, donations, foodNeeds, foodRequests, matchEvents, users, type RequestStatus } from "@/db/schema";
import { estimateMeals, UNIT_SHORT } from "@/lib/donations/meta";
import { notify, transitionInTx, type Tx } from "@/lib/donations/service";
import { splitQuantity, UNMATCHABLE } from "./meta";

const ngo = alias(users, "ngo");

type AllocateOpts = {
  actorId: string;
  /** The request must currently be in this state: PENDING (direct request) or MATCHED (system proposal). */
  from: Extract<RequestStatus, "PENDING" | "MATCHED">;
  /** Ownership: the NGO accepting its own match, or the donor accepting a request for their donation. */
  ngoId?: string;
  donorId?: string;
  note?: string;
};

/**
 * Accept → Allocate, in one transaction:
 * 1. lock the donation and check it's still available (PENDING and fresh)
 * 2. MATCHED via transitionInTx, with the delivery task snapshot (where and by when); this
 *    also offers the pickup task to the nearest available volunteer
 * 3. reserve only the requested quantity: a clearly larger donation is split, and the remainder
 *    stays available as a new PENDING donation (with fitting direct requests moved onto it)
 * 4. mark the request ACCEPTED + allocated, log ALLOCATED, decline other requests on the food
 * Returns an error message, or null on success. Callers re-run matching afterwards.
 */
export async function allocateInTx(tx: Tx, requestId: string, opts: AllocateOpts): Promise<string | null> {
  const [r] = await tx
    .select({
      donationId: foodRequests.donationId,
      ngoId: foodRequests.ngoId,
      needId: foodRequests.needId,
      quantity: foodRequests.quantity,
      people: foodRequests.people,
      foodType: donations.foodType,
      donorId: donations.donorId,
      ngoName: sql<string>`coalesce(${ngo.organizationName}, ${ngo.name})`,
      ngoAddress: ngo.address,
      ngoArea: ngo.area,
      ngoLat: ngo.lat,
      ngoLng: ngo.lng,
      needAddress: foodNeeds.address,
      needArea: foodNeeds.area,
      needLat: foodNeeds.lat,
      needLng: foodNeeds.lng,
      neededBy: foodNeeds.neededBy,
    })
    .from(foodRequests)
    .innerJoin(donations, eq(donations.id, foodRequests.donationId))
    .innerJoin(ngo, eq(ngo.id, foodRequests.ngoId))
    .leftJoin(foodNeeds, eq(foodNeeds.id, foodRequests.needId))
    .where(
      and(
        eq(foodRequests.id, requestId),
        eq(foodRequests.status, opts.from),
        opts.ngoId ? eq(foodRequests.ngoId, opts.ngoId) : undefined,
        opts.donorId ? eq(donations.donorId, opts.donorId) : undefined,
      ),
    );
  if (!r) return "This match is no longer available.";

  // Lock the donation row so two NGOs can't split or claim the same food at once.
  const [d] = await tx
    .select({
      status: donations.status,
      quantity: donations.quantity,
      unit: donations.unit,
      meals: donations.mealsEstimate,
      expiresAt: donations.expiresAt,
      safetyFlag: donations.safetyFlag,
    })
    .from(donations)
    .where(eq(donations.id, r.donationId))
    .for("update");
  if (d?.safetyFlag) return "This food is paused for a food-safety check and can’t be allocated right now.";
  if (!d || d.status !== "PENDING" || d.expiresAt <= new Date()) {
    await tx.update(foodRequests).set({ status: "DECLINED", updatedAt: new Date() }).where(eq(foodRequests.id, requestId));
    return "Sorry, this food was just taken or has expired. We’ll look for another match.";
  }

  // Deliver where the food request says, else to the NGO's own address and map pin.
  const needPinned = r.needLat !== null && r.needLng !== null;
  const delivery = {
    address: r.needAddress ?? r.ngoAddress ?? r.needArea ?? r.ngoArea,
    lat: needPinned ? r.needLat : r.ngoLat,
    lng: needPinned ? r.needLng : r.ngoLng,
    deliverBy: r.neededBy && r.neededBy < d.expiresAt ? r.neededBy : d.expiresAt,
  };
  const ok = await transitionInTx(tx, r.donationId, "MATCHED", {
    actorId: opts.actorId,
    ngoId: r.ngoId,
    note: opts.note,
    delivery,
  });
  if (!ok) return "Sorry, this food was just taken or has expired. We’ll look for another match.";

  // Only once the food is safely MATCHED: split off any surplus as a new available donation.
  const alloc = splitQuantity(d, r.quantity);
  if (alloc.remainder > 0) {
    await splitDonation(tx, r.donationId, requestId, alloc.quantity, alloc.remainder, r.ngoName);
  }

  const now = new Date();
  await tx
    .update(foodRequests)
    .set({ status: "ACCEPTED", quantity: alloc.quantity, allocatedAt: now, updatedAt: now })
    .where(eq(foodRequests.id, requestId));
  await tx.insert(matchEvents).values({
    requestId,
    donationId: r.donationId,
    ngoId: r.ngoId,
    needId: r.needId,
    status: "ALLOCATED",
    quantity: alloc.quantity,
    people: Math.min(r.people, alloc.meals),
    note: alloc.remainder > 0 ? `Partial: ${alloc.remainder} ${UNIT_SHORT[d.unit]} split off and still available` : null,
  });
  await declineOtherRequests(tx, r.donationId, requestId, r.foodType);
  return null;
}

/**
 * Partial allocation: the donation keeps `keep` for the accepting NGO, and a new PENDING donation
 * with the same details holds the remainder (linked by parent_id). Direct requests from other NGOs
 * that still fit are moved onto the remainder instead of being declined.
 */
async function splitDonation(tx: Tx, donationId: string, keepRequestId: string, keep: number, remainder: number, ngoName: string) {
  const [src] = await tx.select().from(donations).where(eq(donations.id, donationId));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, updatedAt, status, ngoId, volunteerId, cancelReason, mealsServed, deliveryAddress, deliveryLat, deliveryLng, deliverBy, ...copy } =
    src;
  const [child] = await tx
    .insert(donations)
    .values({ ...copy, quantity: remainder, mealsEstimate: estimateMeals(remainder, src.unit), parentId: donationId, status: "PENDING" })
    .returning({ id: donations.id });
  await tx
    .update(donations)
    .set({ quantity: keep, mealsEstimate: estimateMeals(keep, src.unit), updatedAt: new Date() })
    .where(eq(donations.id, donationId));

  const unit = UNIT_SHORT[src.unit];
  await tx.insert(donationEvents).values({
    donationId: child.id,
    status: "PENDING",
    note: `Remaining ${remainder} ${unit} after ${keep} ${unit} went to ${ngoName}`,
  });
  await tx
    .update(foodRequests)
    .set({ donationId: child.id, updatedAt: new Date() })
    .where(
      and(
        eq(foodRequests.donationId, donationId),
        eq(foodRequests.status, "PENDING"),
        ne(foodRequests.id, keepRequestId),
        lte(foodRequests.quantity, remainder),
      ),
    );
  await notify(
    tx,
    src.donorId,
    child.id,
    "partially_allocated",
    `${keep} ${unit} of “${src.foodType}” went to ${ngoName}. The other ${remainder} ${unit} are still available for other NGOs.`,
  );
  return child.id;
}

/** Once a donation goes to one NGO, every other open request or system match on it is declined. */
export async function declineOtherRequests(tx: Tx, donationId: string, keepRequestId: string, foodType: string) {
  const declined = await tx
    .update(foodRequests)
    .set({ status: "DECLINED", updatedAt: new Date() })
    .where(
      and(
        eq(foodRequests.donationId, donationId),
        inArray(foodRequests.status, ["PENDING", "MATCHED"]),
        ne(foodRequests.id, keepRequestId),
      ),
    )
    .returning({ ngoId: foodRequests.ngoId });
  for (const r of declined) {
    await notify(tx, r.ngoId, donationId, "request_declined", `“${foodType}” went to another NGO this time.`);
  }
}

/**
 * Cancels an allocated match before pickup (NGO or admin). The donation goes back to PENDING so it
 * can be matched again; the volunteer (if any) is released. Returns an error message or null.
 */
export async function cancelMatch(requestId: string, opts: { actorId: string; ngoId?: string; byAdmin?: boolean; reason?: string | null }) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [r] = await tx
      .select({ donationId: foodRequests.donationId, ngoId: foodRequests.ngoId, donationNgo: donations.ngoId, status: donations.status })
      .from(foodRequests)
      .innerJoin(donations, eq(donations.id, foodRequests.donationId))
      .where(and(eq(foodRequests.id, requestId), eq(foodRequests.status, "ACCEPTED"), opts.ngoId ? eq(foodRequests.ngoId, opts.ngoId) : undefined));
    if (!r || r.donationNgo !== r.ngoId) return "This match can’t be cancelled any more.";
    if (!UNMATCHABLE.includes(r.status)) return "The food has already been picked up, so the match can’t be cancelled now.";

    const ok = await transitionInTx(tx, r.donationId, "PENDING", {
      unmatch: true,
      actorId: opts.actorId,
      byAdmin: opts.byAdmin,
      note: opts.reason ?? (opts.byAdmin ? "Match cancelled by FoodBridge" : "Match cancelled by the NGO"),
    });
    if (!ok) return "This match can’t be cancelled any more.";
    await tx.update(foodRequests).set({ status: "CANCELLED", updatedAt: new Date() }).where(eq(foodRequests.id, requestId));
    return null;
  });
}

/** The NGO (or an admin for it) rejects a proposed match. Matching then looks for another donation. */
export async function rejectMatch(requestId: string, scope: { ngoId?: string } = {}) {
  const db = await getDb();
  const [row] = await db
    .update(foodRequests)
    .set({ status: "SKIPPED", updatedAt: new Date() })
    .where(and(eq(foodRequests.id, requestId), eq(foodRequests.status, "MATCHED"), scope.ngoId ? eq(foodRequests.ngoId, scope.ngoId) : undefined))
    .returning({ ngoId: foodRequests.ngoId, donationId: foodRequests.donationId });
  return row ?? null;
}

/* ------------------------------------------------------------- history */

export type MatchHistoryScope = { donationId?: string; needId?: string; ngoId?: string };

/** Which donation was proposed to, accepted by and allocated to which NGO, and when (newest first). */
export async function listMatchHistory(scope: MatchHistoryScope, limit = 50) {
  const db = await getDb();
  return db
    .select({
      id: matchEvents.id,
      status: matchEvents.status,
      quantity: matchEvents.quantity,
      people: matchEvents.people,
      note: matchEvents.note,
      createdAt: matchEvents.createdAt,
      requestId: matchEvents.requestId,
      needId: matchEvents.needId,
      donationId: matchEvents.donationId,
      foodType: donations.foodType,
      unit: donations.unit,
      ngoId: matchEvents.ngoId,
      ngoName: sql<string>`coalesce(${ngo.organizationName}, ${ngo.name})`,
    })
    .from(matchEvents)
    .innerJoin(donations, eq(donations.id, matchEvents.donationId))
    .innerJoin(ngo, eq(ngo.id, matchEvents.ngoId))
    .where(
      and(
        scope.donationId
          ? sql`(${matchEvents.donationId} = ${scope.donationId} or ${donations.parentId} = ${scope.donationId})`
          : undefined,
        scope.needId ? eq(matchEvents.needId, scope.needId) : undefined,
        scope.ngoId ? eq(matchEvents.ngoId, scope.ngoId) : undefined,
      ),
    )
    .orderBy(desc(matchEvents.createdAt))
    .limit(limit);
}

export type MatchHistoryItem = Awaited<ReturnType<typeof listMatchHistory>>[number];

/** Allocations only: the "what went where" ledger for admins. */
export async function listAllocations(limit = 100) {
  const db = await getDb();
  return db
    .select({
      id: matchEvents.id,
      createdAt: matchEvents.createdAt,
      quantity: matchEvents.quantity,
      people: matchEvents.people,
      note: matchEvents.note,
      donationId: matchEvents.donationId,
      needId: matchEvents.needId,
      foodType: donations.foodType,
      unit: donations.unit,
      donationStatus: donations.status,
      ngoId: matchEvents.ngoId,
      ngoName: sql<string>`coalesce(${ngo.organizationName}, ${ngo.name})`,
    })
    .from(matchEvents)
    .innerJoin(donations, eq(donations.id, matchEvents.donationId))
    .innerJoin(ngo, eq(ngo.id, matchEvents.ngoId))
    .where(eq(matchEvents.status, "ALLOCATED"))
    .orderBy(desc(matchEvents.createdAt))
    .limit(limit);
}
