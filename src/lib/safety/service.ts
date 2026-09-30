import "server-only";

import { alias } from "drizzle-orm/pg-core";
import { and, asc, eq, gt, inArray, isNotNull, isNull, lte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { activityLog, donations, foodRequests, notifications, users } from "@/db/schema";
import { transitionDonation } from "@/lib/donations/service";
import { notify, notifyAdmins } from "@/lib/notifications/service";
import { SAFETY_RULES } from "./meta";

/*
 * Food-safety actions and warnings. Expiry itself needs no code here: every list, the matcher,
 * allocation (transitionInTx) and the volunteer flow already refuse food past expires_at, and
 * housekeeping marks it EXPIRED. This adds the admin hold and timely warnings.
 */

const donor = alias(users, "donor");

async function log(adminId: string, action: string, donationId: string, note: string | null) {
  const db = await getDb();
  await db.insert(activityLog).values({ actorId: adminId, action, targetType: "donation", targetId: donationId, note });
}

/**
 * Pauses a still-unallocated donation for a food-safety check: it disappears from matching and
 * the available-food list, can't be allocated, and waiting system matches are withdrawn.
 */
export async function flagDonation(adminId: string, donationId: string, note: string | null) {
  const db = await getDb();
  const [row] = await db
    .update(donations)
    .set({ safetyFlag: "FLAGGED", safetyNote: note, safetyFlaggedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(donations.id, donationId), eq(donations.status, "PENDING"), isNull(donations.safetyFlag)))
    .returning({ donorId: donations.donorId, foodType: donations.foodType });
  if (!row) return false;
  const withdrawn = await db
    .update(foodRequests)
    .set({ status: "CANCELLED", updatedAt: new Date() })
    .where(and(eq(foodRequests.donationId, donationId), eq(foodRequests.status, "MATCHED")))
    .returning({ ngoId: foodRequests.ngoId });
  for (const w of withdrawn) {
    await notify(db, w.ngoId, donationId, "request_declined", `A match for “${row.foodType}” was withdrawn for a food-safety check. We’ll find you other food.`);
  }
  await notify(
    db,
    row.donorId,
    donationId,
    "safety_review",
    `FoodBridge paused “${row.foodType}” for a food-safety check.${note ? ` ${note}` : ""} Reply to support or cancel it if the food isn’t safe.`,
  );
  await log(adminId, "safety_flag", donationId, note);
  return true;
}

/** Lifts the hold: the food is available again. */
export async function clearSafetyFlag(adminId: string, donationId: string) {
  const db = await getDb();
  const [row] = await db
    .update(donations)
    .set({ safetyFlag: null, safetyNote: null, safetyFlaggedAt: null, updatedAt: new Date() })
    .where(and(eq(donations.id, donationId), eq(donations.safetyFlag, "FLAGGED")))
    .returning({ donorId: donations.donorId, foodType: donations.foodType });
  if (!row) return false;
  await notify(db, row.donorId, donationId, "safety_review", `The safety check for “${row.foodType}” is done. It’s available to NGOs again.`);
  await log(adminId, "safety_clear", donationId, null);
  return true;
}

/** Withdraws food as unsafe: cancelled for everyone (donor, NGO, volunteer), marked DISABLED. */
export async function disableDonation(adminId: string, donationId: string, note: string | null) {
  const reason = `Food safety: ${note ?? "safety information incomplete or doubtful"}`;
  const ok = await transitionDonation(donationId, "CANCELLED", { actorId: adminId, byAdmin: true, note: reason });
  if (!ok) return false;
  const db = await getDb();
  await db
    .update(donations)
    .set({ safetyFlag: "DISABLED", safetyNote: note, safetyFlaggedAt: new Date() })
    .where(eq(donations.id, donationId));
  await log(adminId, "safety_disable", donationId, note);
  return true;
}

/**
 * One-time "expiring soon" warnings (housekeeping), to whoever can still act:
 * - the donor (unmatched food, or food not collected yet)
 * - the NGO it's allocated to, or NGOs with a pending request for it
 * - the volunteer carrying it
 * - admins, when allocated food still hasn't been collected (someone may need to step in)
 */
export async function sendExpiryWarnings() {
  const db = await getDb();
  const now = new Date();
  const soon = await db
    .select({
      id: donations.id,
      foodType: donations.foodType,
      status: donations.status,
      donorId: donations.donorId,
      ngoId: donations.ngoId,
      volunteerId: donations.volunteerId,
      expiresAt: donations.expiresAt,
    })
    .from(donations)
    .where(
      and(
        inArray(donations.status, ["PENDING", "MATCHED", "ASSIGNED"]),
        gt(donations.expiresAt, now),
        lte(donations.expiresAt, new Date(now.getTime() + SAFETY_RULES.expiringSoonMinutes * 60_000)),
      ),
    )
    .orderBy(asc(donations.expiresAt))
    .limit(200);

  for (const d of soon) {
    const minutes = Math.max(1, Math.round((d.expiresAt.getTime() - now.getTime()) / 60_000));
    const recipients: { userId: string; message: string }[] = [
      { userId: d.donorId, message: `“${d.foodType}” expires in ${minutes} min and hasn’t been picked up yet.` },
    ];
    if (d.ngoId) recipients.push({ userId: d.ngoId, message: `“${d.foodType}” (on its way to you) expires in ${minutes} min.` });
    else {
      const requesters = await db
        .select({ ngoId: foodRequests.ngoId })
        .from(foodRequests)
        .where(and(eq(foodRequests.donationId, d.id), inArray(foodRequests.status, ["PENDING", "MATCHED"])));
      for (const r of requesters) recipients.push({ userId: r.ngoId, message: `“${d.foodType}”, which you’re waiting on, expires in ${minutes} min.` });
    }
    if (d.volunteerId) recipients.push({ userId: d.volunteerId, message: `Hurry: “${d.foodType}” expires in ${minutes} min. Pick it up as soon as you can.` });

    for (const r of recipients) {
      const [already] = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(and(eq(notifications.donationId, d.id), eq(notifications.userId, r.userId), eq(notifications.type, "expiry_warning")))
        .limit(1);
      if (!already) await notify(db, r.userId, d.id, "expiry_warning", r.message);
    }
    if (d.status !== "PENDING") {
      await notifyAdmins(db, d.id, `Allocated food “${d.foodType}” expires in ${minutes} min and hasn’t been collected yet.`, "expiry_warning");
    }
  }
  return soon.length;
}

/** For the admin dashboard: food close to expiry, and donations on a safety hold. */
export async function getSafetyOverview() {
  const db = await getDb();
  const now = new Date();
  const columns = {
    id: donations.id,
    foodType: donations.foodType,
    status: donations.status,
    expiresAt: donations.expiresAt,
    safetyFlag: donations.safetyFlag,
    safetyNote: donations.safetyNote,
    donorName: sql<string>`coalesce(${donor.organizationName}, ${donor.name})`,
  };
  const [expiring, flagged] = await Promise.all([
    db
      .select(columns)
      .from(donations)
      .innerJoin(donor, eq(donor.id, donations.donorId))
      .where(
        and(
          inArray(donations.status, ["PENDING", "MATCHED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"]),
          gt(donations.expiresAt, now),
          lte(donations.expiresAt, new Date(now.getTime() + SAFETY_RULES.expiringSoonMinutes * 60_000)),
        ),
      )
      .orderBy(asc(donations.expiresAt))
      .limit(20),
    db
      .select(columns)
      .from(donations)
      .innerJoin(donor, eq(donor.id, donations.donorId))
      .where(and(isNotNull(donations.safetyFlag), eq(donations.safetyFlag, "FLAGGED")))
      .orderBy(asc(donations.expiresAt))
      .limit(20),
  ]);
  return { expiring, flagged };
}
