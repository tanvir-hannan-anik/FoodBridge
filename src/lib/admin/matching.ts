import "server-only";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { activityLog, foodRequests } from "@/db/schema";
import { notify } from "@/lib/donations/service";
import { cancelMatch, rejectMatch } from "@/lib/matching/service";
import { acceptMatch, matchOpenNeeds } from "@/lib/requests/service";

/*
 * Admin control over system matches: accept on the NGO's behalf, reject, or cancel an allocated
 * match before pickup. Each action is written to the activity log.
 */

async function log(adminId: string, action: string, requestId: string, note?: string | null) {
  const db = await getDb();
  await db.insert(activityLog).values({ actorId: adminId, action, targetType: "request", targetId: requestId, note: note ?? null });
}

async function requestParties(requestId: string) {
  const db = await getDb();
  const [row] = await db
    .select({ ngoId: foodRequests.ngoId, donationId: foodRequests.donationId })
    .from(foodRequests)
    .where(eq(foodRequests.id, requestId));
  return row ?? null;
}

export async function adminAcceptMatch(adminId: string, requestId: string) {
  const error = await acceptMatch(requestId, { actorId: adminId });
  if (error) return error;
  const parties = await requestParties(requestId);
  if (parties) {
    const db = await getDb();
    await notify(db, parties.ngoId, parties.donationId, "request_accepted", "FoodBridge accepted a food match for your request. A volunteer will bring it.");
  }
  await log(adminId, "accept_match", requestId);
  return null;
}

export async function adminRejectMatch(adminId: string, requestId: string) {
  const row = await rejectMatch(requestId);
  if (!row) return false;
  const db = await getDb();
  await notify(db, row.ngoId, row.donationId, "request_declined", "FoodBridge withdrew a food match for your request. We’ll look for another one.");
  await log(adminId, "reject_match", requestId);
  await matchOpenNeeds({ ngoId: row.ngoId });
  return true;
}

export async function adminCancelMatch(adminId: string, requestId: string, reason: string | null) {
  const error = await cancelMatch(requestId, { actorId: adminId, byAdmin: true, reason });
  if (error) return error;
  await log(adminId, "cancel_match", requestId, reason);
  await matchOpenNeeds();
  return null;
}
