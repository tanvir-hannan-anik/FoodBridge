import type { BadgeTone } from "@/components/ui/badge";
import type { DonationStatus, RequestStatus, Unit } from "@/db/schema";
import { estimateMeals, quantityForMeals } from "@/lib/donations/meta";

/*
 * Rule-based matching: every rule and weight lives here, so the algorithm stays transparent,
 * deterministic and easy to tune. The service applies the hard rules in SQL (cheap filtering),
 * then ranks the survivors with `scoreCandidate` below.
 *
 * Hard rules (a donation is never proposed unless all hold):
 * - it is available: PENDING (so not expired, cancelled or already allocated) and fresh for at
 *   least MATCH_RULES.minFreshMinutes more
 * - it is ready for pickup before the request's needed-by time
 * - same food category, unless the request accepts any food
 * - within MATCH_RULES.maxDistanceKm of the delivery point, when both locations are pinned
 * - not waiting on another NGO's decision, and never proposed to this NGO before
 *
 * Ranking (higher score first; ties → earlier expiry → older donation):
 *   score = expiry × w.expiry + distance × w.distance + quantity × w.quantity
 */
export const MATCH_RULES = {
  /** Matched food must stay fresh at least this long, so there's time to deliver it. */
  minFreshMinutes: 60,
  /** Never propose food further than this from the delivery point (when both are pinned). */
  maxDistanceKm: 15,
  /** How many available donations are ranked per request (earliest expiry first). */
  candidateLimit: 50,
  weights: { expiry: 0.4, distance: 0.35, quantity: 0.25 },
  /** Split a donation only if the part left over still feeds at least this many people. */
  minSplitMeals: 5,
} as const;

export type MatchCandidate = {
  expiresAt: Date;
  meals: number;
  /** Straight-line km from pickup to delivery; null when either point isn't pinned. */
  distanceKm: number | null;
  /** Fallback when there are no coordinates: the donor's area or address mentions the request's area. */
  sameArea: boolean;
};

export type MatchScore = {
  score: number;
  parts: { expiry: number; distance: number; quantity: number };
};

/** 0–1 per factor, then the weighted sum. Pure and deterministic (pass `now` in tests). */
export function scoreCandidate(c: MatchCandidate, remainingMeals: number, now = new Date()): MatchScore {
  // Earlier expiry first: food that expires in 1 h scores ~0.86, in 6 h 0.5, in 24 h 0.2.
  const hoursLeft = Math.max(0, (c.expiresAt.getTime() - now.getTime()) / 3_600_000);
  const expiry = 1 / (1 + hoursLeft / 6);

  // Closer first. Unknown distance: a same-area text match counts as "fairly close".
  const distance =
    c.distanceKm !== null ? 1 - Math.min(c.distanceKm, MATCH_RULES.maxDistanceKm) / MATCH_RULES.maxDistanceKm : c.sameArea ? 0.6 : 0.2;

  // Suitable quantity: covering the whole need is best. Larger donations are fine (the surplus
  // is split off and stays available) but lose a little for the extra handling; smaller ones
  // score by how much of the need they cover.
  const quantity =
    remainingMeals <= 0
      ? 0
      : c.meals >= remainingMeals
        ? 1 - 0.2 * Math.min(1, (c.meals - remainingMeals) / c.meals)
        : c.meals / remainingMeals;

  const w = MATCH_RULES.weights;
  return { score: expiry * w.expiry + distance * w.distance + quantity * w.quantity, parts: { expiry, distance, quantity } };
}

/** Deterministic ordering for candidates with scores. */
export function compareCandidates<T extends { id: string; expiresAt: Date; createdAt: Date; match: MatchScore }>(a: T, b: T) {
  return (
    b.match.score - a.match.score ||
    a.expiresAt.getTime() - b.expiresAt.getTime() ||
    a.createdAt.getTime() - b.createdAt.getTime() ||
    a.id.localeCompare(b.id)
  );
}

/**
 * How much of a donation goes to a request that still needs `wantedMeals` meals. When the donation
 * is clearly larger, only what's needed is allocated and the rest is split off as a new donation.
 */
export function allocationFor(donation: { quantity: number; unit: Unit; meals: number }, wantedMeals: number) {
  return splitQuantity(donation, quantityForMeals(Math.max(1, wantedMeals), donation.unit));
}

/** Allocates `wanted` of the donation's quantity; splits only if the remainder is worth a separate pickup. */
export function splitQuantity(donation: { quantity: number; unit: Unit; meals: number }, wanted: number) {
  const remainder = donation.quantity - wanted;
  if (wanted <= 0 || remainder <= 0 || estimateMeals(remainder, donation.unit) < MATCH_RULES.minSplitMeals) {
    return { quantity: donation.quantity, meals: donation.meals, remainder: 0 };
  }
  return { quantity: wanted, meals: estimateMeals(wanted, donation.unit), remainder };
}

/** One-line, human explanation of why a donation was proposed. */
export function explainMatch(c: MatchCandidate, remainingMeals: number) {
  const bits: string[] = [];
  if (c.distanceKm !== null) bits.push(c.distanceKm < 1 ? "under 1 km away" : `${c.distanceKm.toFixed(1)} km away`);
  else if (c.sameArea) bits.push("in your area");
  bits.push(c.meals >= remainingMeals ? `covers all ${remainingMeals} meals` : `covers ${c.meals} of ${remainingMeals} meals`);
  return bits.join(" · ");
}

/* ------------------------------------------------------------ match status */

/**
 * Match status, derived from the food_requests row and its donation:
 * Pending (waiting for the donor / a proposal) → Matched (proposed; the NGO decides) →
 * Accepted → Allocated (quantity reserved and the volunteer pickup task created).
 * Off the path: Rejected, Cancelled, Expired.
 */
export const MATCH_FLOW = ["pending", "matched", "accepted", "allocated"] as const;
export type MatchStage = (typeof MATCH_FLOW)[number] | "rejected" | "cancelled" | "expired";

export function matchStage(status: RequestStatus, allocatedAt: Date | null, donationStatus?: DonationStatus): MatchStage {
  switch (status) {
    case "PENDING":
      return "pending";
    case "MATCHED":
      return "matched";
    case "ACCEPTED":
      if (donationStatus === "CANCELLED") return "cancelled";
      if (donationStatus === "EXPIRED") return "expired";
      return allocatedAt ? "allocated" : "accepted";
    case "DECLINED":
    case "SKIPPED":
      return "rejected";
    case "EXPIRED":
      return "expired";
    default:
      return "cancelled";
  }
}

export const MATCH_STAGE_META: Record<MatchStage, { label: string; tone: BadgeTone; description: string }> = {
  pending: { label: "Pending", tone: "warning", description: "Waiting for the donor to decide, or for suitable food." },
  matched: { label: "Matched", tone: "info", description: "Suitable food found. Waiting for the NGO to accept." },
  accepted: { label: "Accepted", tone: "violet", description: "Accepted. Reserving the food and creating the pickup task." },
  allocated: { label: "Allocated", tone: "success", description: "Food reserved for the NGO and a volunteer pickup task created." },
  rejected: { label: "Rejected", tone: "neutral", description: "Passed on, or the food went to another NGO." },
  cancelled: { label: "Cancelled", tone: "neutral", description: "The match was cancelled." },
  expired: { label: "Expired", tone: "danger", description: "The food expired first." },
};

/** Labels for the matching history (match_events.status). */
export const MATCH_EVENT_LABEL: Record<RequestStatus | "ALLOCATED", string> = {
  PENDING: "NGO requested it",
  MATCHED: "Matched by the system",
  ACCEPTED: "Accepted",
  ALLOCATED: "Allocated · pickup task created",
  DECLINED: "Declined / went elsewhere",
  SKIPPED: "Rejected by the NGO",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

/** An allocated match can be cancelled (food goes back to the pool) until the volunteer has collected it. */
export const UNMATCHABLE: DonationStatus[] = ["MATCHED", "ASSIGNED"];
