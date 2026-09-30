import "server-only";

import { alias } from "drizzle-orm/pg-core";
import { and, count, desc, eq, gte, ilike, inArray, isNull, lte, ne, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  activityLog,
  donationEvents,
  donations,
  foodNeeds,
  foodRequests,
  taskOffers,
  users,
  type ActivityLogEntry,
  type DonationStatus,
  type RequestStatus,
  type Role,
  type UserStatus,
} from "@/db/schema";
import { ACTIVE_STATUSES } from "@/lib/donations/meta";
import { distanceKm, toPoint } from "@/lib/geo";
import { mealsCounted, notify, transitionDonation, transitionInTx } from "@/lib/donations/service";
import { endNeed } from "@/lib/requests/service";
import { safetyWindowIssue } from "@/lib/safety/meta";
import { DISPATCH_RULES } from "@/lib/volunteer/meta";
import type { AdminFilters } from "./filters";
import { recordActivity } from "./log";

const donor = alias(users, "donor");
const ngo = alias(users, "ngo");
const volunteer = alias(users, "volunteer");
const actor = alias(users, "actor");

function like(value: string) {
  return `%${value.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

function dateRange(column: Parameters<typeof gte>[0], f: AdminFilters) {
  return [f.from ? gte(column, f.from) : undefined, f.to ? lte(column, f.to) : undefined];
}

function log(actorId: string, action: string, targetType: ActivityLogEntry["targetType"], targetId: string, note?: string | null) {
  return recordActivity({ actorId, action, targetType, targetId, note });
}

/* ------------------------------------------------------------- dashboard */

export async function getAdminStats() {
  const db = await getDb();
  const [[byRole], [donationStats], [pendingClaims], [pendingNeeds]] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*) filter (where ${users.role} <> 'admin')`.mapWith(Number),
        donors: sql<number>`count(*) filter (where ${users.role} = 'donor')`.mapWith(Number),
        ngos: sql<number>`count(*) filter (where ${users.role} = 'ngo')`.mapWith(Number),
        volunteers: sql<number>`count(*) filter (where ${users.role} = 'volunteer')`.mapWith(Number),
        pendingVerification: sql<number>`count(*) filter (where ${users.status} = 'pending')`.mapWith(Number),
        suspended: sql<number>`count(*) filter (where ${users.status} in ('suspended', 'deactivated'))`.mapWith(Number),
        availableVolunteers: sql<number>`count(*) filter (where ${users.role} = 'volunteer' and ${users.status} = 'active' and ${users.available})`.mapWith(
          Number,
        ),
      })
      .from(users),
    db
      .select({
        total: count(),
        active: sql<number>`count(*) filter (where ${inArray(donations.status, ACTIVE_STATUSES)})`.mapWith(Number),
        delivered: sql<number>`count(*) filter (where ${inArray(donations.status, ["DELIVERED", "COMPLETED"])})`.mapWith(Number),
        completed: sql<number>`count(*) filter (where ${donations.status} = 'COMPLETED')`.mapWith(Number),
        expired: sql<number>`count(*) filter (where ${donations.status} = 'EXPIRED')`.mapWith(Number),
        cancelled: sql<number>`count(*) filter (where ${donations.status} = 'CANCELLED')`.mapWith(Number),
        meals: sql<number>`coalesce(sum(${mealsCounted}) filter (where ${donations.status} = 'COMPLETED'), 0)`.mapWith(Number),
        mealsDelivered: sql<number>`coalesce(sum(${mealsCounted}) filter (where ${inArray(donations.status, ["DELIVERED", "COMPLETED"])}), 0)`.mapWith(
          Number,
        ),
      })
      .from(donations),
    db.select({ n: count() }).from(foodRequests).where(inArray(foodRequests.status, ["PENDING", "MATCHED"])),
    db
      .select({ n: count() })
      .from(foodNeeds)
      .where(
        and(
          eq(foodNeeds.status, "OPEN"),
          gte(foodNeeds.neededBy, new Date()),
          sql`not exists (select 1 from ${foodRequests} where ${foodRequests.needId} = ${foodNeeds.id} and ${foodRequests.status} = 'ACCEPTED')`,
        ),
      ),
  ]);
  return { users: byRole, donations: donationStats, pendingRequests: pendingClaims.n + pendingNeeds.n };
}

/** Latest lifecycle events across the platform (created, matched, picked up…). */
export async function recentActivity(limit = 12) {
  const db = await getDb();
  return db
    .select({
      id: donationEvents.id,
      status: donationEvents.status,
      note: donationEvents.note,
      createdAt: donationEvents.createdAt,
      donationId: donations.id,
      foodType: donations.foodType,
      actorName: actor.name,
      actorRole: actor.role,
    })
    .from(donationEvents)
    .innerJoin(donations, eq(donations.id, donationEvents.donationId))
    .leftJoin(actor, eq(actor.id, donationEvents.actorId))
    .orderBy(desc(donationEvents.createdAt))
    .limit(limit);
}

export async function listAdminLog(targetId?: string, limit = 30) {
  const db = await getDb();
  return db
    .select({
      id: activityLog.id,
      action: activityLog.action,
      targetType: activityLog.targetType,
      targetId: activityLog.targetId,
      note: activityLog.note,
      createdAt: activityLog.createdAt,
      actorName: actor.name,
    })
    .from(activityLog)
    .leftJoin(actor, eq(actor.id, activityLog.actorId))
    .where(targetId ? eq(activityLog.targetId, targetId) : undefined)
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);
}

/* ----------------------------------------------------------------- users */

export async function listUsers(f: AdminFilters & { role?: Exclude<Role, "admin"> }, limit = 100) {
  const db = await getDb();
  const q = f.q?.trim();
  const activity = sql<number>`case ${users.role}
    when 'donor' then (select count(*) from ${donations} where ${donations.donorId} = ${users.id})
    when 'ngo' then (select count(*) from ${donations} where ${donations.ngoId} = ${users.id} and ${donations.status} in ('DELIVERED', 'COMPLETED'))
    when 'volunteer' then (select count(*) from ${donations} where ${donations.volunteerId} = ${users.id} and ${donations.status} in ('DELIVERED', 'COMPLETED'))
    else 0 end`.mapWith(Number);
  return db
    .select({
      id: users.id,
      role: users.role,
      status: users.status,
      name: users.name,
      organizationName: users.organizationName,
      email: users.email,
      phone: users.phone,
      area: users.area,
      available: users.available,
      createdAt: users.createdAt,
      activity,
    })
    .from(users)
    .where(
      and(
        ne(users.role, "admin"),
        f.role ? eq(users.role, f.role) : undefined,
        f.status ? eq(users.status, f.status as UserStatus) : undefined,
        f.location ? or(ilike(users.area, like(f.location)), ilike(users.address, like(f.location))) : undefined,
        q
          ? or(
              ilike(users.name, like(q)),
              ilike(users.email, like(q)),
              ilike(users.phone, like(q)),
              ilike(users.organizationName, like(q)),
            )
          : undefined,
        ...dateRange(users.createdAt, f),
      ),
    )
    .orderBy(desc(users.createdAt))
    .limit(limit);
}

export type AdminUserRow = Awaited<ReturnType<typeof listUsers>>[number];

export async function getAdminUser(userId: string) {
  const db = await getDb();
  const [user] = await db.select().from(users).where(and(eq(users.id, userId), ne(users.role, "admin")));
  if (!user) return null;
  const column = user.role === "donor" ? donations.donorId : user.role === "ngo" ? donations.ngoId : donations.volunteerId;
  const [recent, log] = await Promise.all([
    db
      .select({
        id: donations.id,
        foodType: donations.foodType,
        status: donations.status,
        quantity: donations.quantity,
        unit: donations.unit,
        createdAt: donations.createdAt,
        updatedAt: donations.updatedAt,
      })
      .from(donations)
      .where(eq(column, userId))
      .orderBy(desc(donations.updatedAt))
      .limit(15),
    listAdminLog(userId, 20),
  ]);
  // Never hand the password hash to a page.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safe } = user;
  return { ...safe, recent, log };
}

export type UserAction = "approve" | "suspend" | "deactivate" | "reactivate";

const USER_TRANSITIONS: Record<UserAction, { from: UserStatus[]; to: UserStatus }> = {
  approve: { from: ["pending"], to: "active" },
  suspend: { from: ["active", "pending"], to: "suspended" },
  deactivate: { from: ["active", "pending", "suspended"], to: "deactivated" },
  reactivate: { from: ["suspended", "deactivated"], to: "active" },
};

/**
 * Approve (verify), suspend, deactivate or reactivate an account. Blocking an account also
 * releases what it was holding so the food keeps moving:
 * - volunteer: assigned (not yet picked up) tasks go back to other volunteers
 * - NGO: open food requests are cancelled and pending requests/matches withdrawn
 * - donor: donations nobody has matched yet are cancelled
 */
export async function setUserStatus(adminId: string, userId: string, action: UserAction, note?: string | null) {
  const db = await getDb();
  const rule = USER_TRANSITIONS[action];
  const blocking = action === "suspend" || action === "deactivate";
  const [user] = await db
    .update(users)
    // Blocking also ends every session, so reactivating later doesn't revive old cookies.
    .set({ status: rule.to, updatedAt: new Date(), ...(blocking && { sessionVersion: sql`${users.sessionVersion} + 1` }) })
    .where(and(eq(users.id, userId), ne(users.role, "admin"), inArray(users.status, rule.from)))
    .returning({ id: users.id, role: users.role });
  if (!user) return false;

  if (action === "approve" && (user.role === "ngo" || user.role === "volunteer")) {
    const message =
      user.role === "ngo"
        ? "Your NGO is verified. You can now request food."
        : "You’re verified! Switch to Available to start receiving pickups.";
    await notify(db, userId, null, "account_verified", message);
  }

  if (action === "suspend" || action === "deactivate") {
    const reason = action === "suspend" ? "Account suspended" : "Account deactivated";
    if (user.role === "volunteer") {
      const held = await db
        .select({ id: donations.id })
        .from(donations)
        .where(and(eq(donations.volunteerId, userId), eq(donations.status, "ASSIGNED")));
      for (const d of held) {
        await transitionDonation(d.id, "MATCHED", { actorId: adminId, releaseVolunteer: true, note: `${reason}; volunteer released` });
      }
    } else if (user.role === "ngo") {
      const open = await db
        .select({ id: foodNeeds.id })
        .from(foodNeeds)
        .where(and(eq(foodNeeds.ngoId, userId), eq(foodNeeds.status, "OPEN")));
      for (const n of open) await endNeed(n.id, "cancel");
      await db
        .update(foodRequests)
        .set({ status: "CANCELLED", updatedAt: new Date() })
        .where(and(eq(foodRequests.ngoId, userId), inArray(foodRequests.status, ["PENDING", "MATCHED"])));
    } else if (user.role === "donor") {
      const open = await db
        .select({ id: donations.id })
        .from(donations)
        .where(and(eq(donations.donorId, userId), eq(donations.status, "PENDING")));
      for (const d of open) {
        await transitionDonation(d.id, "CANCELLED", { actorId: adminId, byAdmin: true, note: reason });
      }
    }
  }

  await log(adminId, action, "user", userId, note);
  return true;
}

/* ------------------------------------------------------------- donations */

export async function listAdminDonations(f: AdminFilters, limit = 100) {
  const db = await getDb();
  const q = f.q?.trim();
  return db
    .select({
      id: donations.id,
      foodType: donations.foodType,
      category: donations.category,
      quantity: donations.quantity,
      unit: donations.unit,
      status: donations.status,
      expiresAt: donations.expiresAt,
      safetyFlag: donations.safetyFlag,
      createdAt: donations.createdAt,
      updatedAt: donations.updatedAt,
      pickupAddress: donations.pickupAddress,
      donorName: sql<string>`coalesce(${donor.organizationName}, ${donor.name})`,
      donorArea: donor.area,
      ngoName: sql<string | null>`coalesce(${ngo.organizationName}, ${ngo.name})`,
      volunteerName: volunteer.name,
    })
    .from(donations)
    .innerJoin(donor, eq(donor.id, donations.donorId))
    .leftJoin(ngo, eq(ngo.id, donations.ngoId))
    .leftJoin(volunteer, eq(volunteer.id, donations.volunteerId))
    .where(
      and(
        f.status ? eq(donations.status, f.status as DonationStatus) : undefined,
        f.location ? or(ilike(donations.pickupAddress, like(f.location)), ilike(donor.area, like(f.location))) : undefined,
        q
          ? or(
              ilike(donations.foodType, like(q)),
              ilike(donor.name, like(q)),
              ilike(donor.organizationName, like(q)),
              ilike(ngo.organizationName, like(q)),
            )
          : undefined,
        ...dateRange(donations.createdAt, f),
      ),
    )
    .orderBy(desc(donations.createdAt))
    .limit(limit);
}

export async function getAdminDonation(donationId: string) {
  const db = await getDb();
  const [row] = await db
    .select({
      donation: donations,
      donor: { id: donor.id, name: donor.name, org: donor.organizationName, phone: donor.phone, area: donor.area },
      ngo: { id: ngo.id, name: ngo.name, org: ngo.organizationName, phone: ngo.phone, area: ngo.area },
      volunteer: { id: volunteer.id, name: volunteer.name, phone: volunteer.phone },
    })
    .from(donations)
    .innerJoin(donor, eq(donor.id, donations.donorId))
    .leftJoin(ngo, eq(ngo.id, donations.ngoId))
    .leftJoin(volunteer, eq(volunteer.id, donations.volunteerId))
    .where(eq(donations.id, donationId));
  if (!row) return null;

  const requester = alias(users, "requester");
  const [events, requests, log] = await Promise.all([
    db
      .select({
        status: donationEvents.status,
        note: donationEvents.note,
        createdAt: donationEvents.createdAt,
        actorName: actor.name,
        actorRole: actor.role,
      })
      .from(donationEvents)
      .leftJoin(actor, eq(actor.id, donationEvents.actorId))
      .where(eq(donationEvents.donationId, donationId))
      .orderBy(donationEvents.createdAt),
    db
      .select({
        id: foodRequests.id,
        status: foodRequests.status,
        needId: foodRequests.needId,
        quantity: foodRequests.quantity,
        people: foodRequests.people,
        allocatedAt: foodRequests.allocatedAt,
        distanceKm: foodRequests.distanceKm,
        createdAt: foodRequests.createdAt,
        ngoId: requester.id,
        ngoName: sql<string>`coalesce(${requester.organizationName}, ${requester.name})`,
      })
      .from(foodRequests)
      .innerJoin(requester, eq(requester.id, foodRequests.ngoId))
      .where(eq(foodRequests.donationId, donationId))
      .orderBy(desc(foodRequests.createdAt)),
    listAdminLog(donationId, 20),
  ]);

  const { imageData, ...donation } = row.donation;
  return {
    ...donation,
    hasImage: imageData !== null,
    donor: row.donor,
    ngo: row.ngo?.id ? row.ngo : null,
    volunteer: row.volunteer?.id ? row.volunteer : null,
    events,
    requests,
    log,
  };
}

export type DonationEdit = {
  foodType: string;
  quantity: number;
  unit: (typeof donations.$inferSelect)["unit"];
  pickupAt: Date;
  expiresAt: Date;
  pickupAddress: string;
  contactName: string;
  contactPhone: string;
  instructions: string | null;
};

/**
 * Corrects a donation's details while it's still in progress. Recorded in the admin log, not the
 * status timeline. The new best-before must still be ahead and inside the food-safety window.
 * Returns true, or the reason the change was refused.
 */
export async function updateDonationDetails(adminId: string, donationId: string, input: DonationEdit): Promise<true | string> {
  const db = await getDb();
  const [current] = await db
    .select({ category: donations.category, condition: donations.condition, preparedAt: donations.preparedAt, expiresAt: donations.expiresAt })
    .from(donations)
    .where(eq(donations.id, donationId));
  if (!current) return "This donation no longer exists.";
  if (input.expiresAt.getTime() !== current.expiresAt.getTime()) {
    if (input.expiresAt <= new Date()) return "The best-before time must be in the future.";
    const issue = safetyWindowIssue({ ...current, expiresAt: input.expiresAt });
    if (issue) return issue;
  }

  const [row] = await db
    .update(donations)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(donations.id, donationId), inArray(donations.status, ["PENDING", "MATCHED", "ASSIGNED"])))
    .returning({ id: donations.id });
  if (!row) return "Only donations that haven’t been picked up yet can be edited.";
  await log(adminId, "edit", "donation", donationId, "Details updated");
  return true;
}

export async function adminCancelDonation(adminId: string, donationId: string, reason: string | null) {
  const ok = await transitionDonation(donationId, "CANCELLED", { actorId: adminId, byAdmin: true, note: reason ?? "Cancelled by admin" });
  if (ok) await log(adminId, "cancel", "donation", donationId, reason);
  return ok;
}

export async function adminReleaseVolunteer(adminId: string, donationId: string) {
  const db = await getDb();
  const ok = await db.transaction((tx) =>
    transitionInTx(tx, donationId, "MATCHED", { actorId: adminId, releaseVolunteer: true, note: "Volunteer released by admin" }),
  );
  if (ok) await log(adminId, "release_volunteer", "donation", donationId);
  return ok;
}

/* -------------------------------------------------------------- requests */

/** Direct NGO requests for a donation, and system matches, for monitoring. */
export async function listAdminClaims(f: AdminFilters, limit = 100) {
  const db = await getDb();
  const q = f.q?.trim();
  return db
    .select({
      id: foodRequests.id,
      status: foodRequests.status,
      needId: foodRequests.needId,
      quantity: foodRequests.quantity,
      people: foodRequests.people,
      createdAt: foodRequests.createdAt,
      donationId: donations.id,
      donationStatus: donations.status,
      foodType: donations.foodType,
      unit: donations.unit,
      ngoId: ngo.id,
      ngoName: sql<string>`coalesce(${ngo.organizationName}, ${ngo.name})`,
      ngoArea: ngo.area,
    })
    .from(foodRequests)
    .innerJoin(donations, eq(donations.id, foodRequests.donationId))
    .innerJoin(ngo, eq(ngo.id, foodRequests.ngoId))
    .where(
      and(
        f.status ? eq(foodRequests.status, f.status as RequestStatus) : undefined,
        f.location ? ilike(ngo.area, like(f.location)) : undefined,
        q ? or(ilike(donations.foodType, like(q)), ilike(ngo.organizationName, like(q)), ilike(ngo.name, like(q))) : undefined,
        ...dateRange(foodRequests.createdAt, f),
      ),
    )
    .orderBy(desc(foodRequests.createdAt))
    .limit(limit);
}

export async function adminCancelClaim(adminId: string, requestId: string) {
  const db = await getDb();
  const [row] = await db
    .update(foodRequests)
    .set({ status: "CANCELLED", updatedAt: new Date() })
    .where(and(eq(foodRequests.id, requestId), inArray(foodRequests.status, ["PENDING", "MATCHED"])))
    .returning({ ngoId: foodRequests.ngoId, donationId: foodRequests.donationId });
  if (!row) return false;
  await notify(db, row.ngoId, row.donationId, "request_declined", "FoodBridge withdrew one of your requests. Contact support if this is unexpected.");
  await log(adminId, "cancel", "request", requestId);
  return true;
}

export async function adminCancelNeed(adminId: string, needId: string, reason: string | null) {
  const row = await endNeed(needId, "cancel");
  if (!row) return false;
  const db = await getDb();
  await notify(db, row.ngoId, null, "request_declined", `FoodBridge cancelled one of your food requests.${reason ? ` Reason: ${reason}` : ""}`);
  await log(adminId, "cancel", "need", needId, reason);
  return true;
}

/* ----------------------------------------------------------- resolving */

/** Active volunteers an admin can hand an unassigned pickup to: available ones first, then nearest. */
export async function listVolunteerChoices(donationId: string) {
  const db = await getDb();
  const [d] = await db
    .select({
      lat: sql<number | null>`coalesce(${donations.pickupLat}, ${donor.lat})`,
      lng: sql<number | null>`coalesce(${donations.pickupLng}, ${donor.lng})`,
    })
    .from(donations)
    .innerJoin(donor, eq(donor.id, donations.donorId))
    .where(eq(donations.id, donationId));
  if (!d) return [];
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      area: users.area,
      available: users.available,
      lat: users.lat,
      lng: users.lng,
      activeTasks: sql<number>`(select count(*) from ${donations} t where t.volunteer_id = ${users.id} and t.status in ('ASSIGNED','PICKED_UP','IN_TRANSIT'))`.mapWith(
        Number,
      ),
    })
    .from(users)
    .where(and(eq(users.role, "volunteer"), eq(users.status, "active")));
  const pickup = toPoint(d.lat, d.lng);
  return rows
    .map(({ lat, lng, ...v }) => ({ ...v, km: distanceKm(pickup, toPoint(lat, lng)) }))
    .sort((a, b) => Number(b.available) - Number(a.available) || (a.km ?? 1e9) - (b.km ?? 1e9) || a.name.localeCompare(b.name))
    .slice(0, 50);
}

/**
 * Offers an allocated pickup that nobody has taken to a volunteer the admin picked (e.g. after
 * calling them). Any other waiting offer is withdrawn. The volunteer still accepts or declines,
 * and the usual timeout applies.
 */
export async function adminOfferToVolunteer(adminId: string, donationId: string, volunteerId: string): Promise<true | string> {
  const db = await getDb();
  const result = await db.transaction(async (tx): Promise<{ name: string } | string> => {
    const [d] = await tx
      .select({ foodType: donations.foodType, expiresAt: donations.expiresAt, safetyFlag: donations.safetyFlag })
      .from(donations)
      .where(and(eq(donations.id, donationId), eq(donations.status, "MATCHED"), isNull(donations.volunteerId)))
      .for("update");
    if (!d) return "This pickup already has a volunteer or is no longer waiting for one.";
    if (d.safetyFlag) return "This food is on a safety hold. Clear the hold first.";
    if (d.expiresAt <= new Date()) return "This food is past its best-before time.";
    const [v] = await tx
      .select({ name: users.name })
      .from(users)
      .where(and(eq(users.id, volunteerId), eq(users.role, "volunteer"), eq(users.status, "active")));
    if (!v) return "Choose an active, verified volunteer.";

    const now = new Date();
    await tx
      .update(taskOffers)
      .set({ status: "WITHDRAWN", respondedAt: now, note: "Reassigned by FoodBridge" })
      .where(and(eq(taskOffers.donationId, donationId), eq(taskOffers.status, "OFFERED"), ne(taskOffers.volunteerId, volunteerId)));
    // One row per donation + volunteer: re-offering someone who declined before reopens their row.
    await tx
      .insert(taskOffers)
      .values({ donationId, volunteerId, note: "Offered by FoodBridge" })
      .onConflictDoUpdate({
        target: [taskOffers.donationId, taskOffers.volunteerId],
        set: { status: "OFFERED", createdAt: now, respondedAt: null, note: "Offered by FoodBridge" },
      });
    await notify(
      tx,
      volunteerId,
      donationId,
      "task_assigned",
      `FoodBridge has asked you to pick up “${d.foodType}”. Please accept or decline within ${DISPATCH_RULES.offerMinutes} minutes.`,
    );
    return { name: v.name };
  });
  if (typeof result === "string") return result;
  await log(adminId, "offer_volunteer", "donation", donationId, result.name);
  return true;
}

/** The food arrived but neither the volunteer nor the NGO confirmed it: record the delivery with the admin's note. */
export async function adminConfirmDelivery(adminId: string, donationId: string, note: string) {
  const ok = await transitionDonation(donationId, "DELIVERED", { actorId: adminId, note: `Confirmed by FoodBridge: ${note}` });
  if (ok) await log(adminId, "confirm_delivery", "donation", donationId, note);
  return ok;
}

/** The NGO distributed the food but never recorded it: record meals served on their behalf. */
export async function adminCompleteDonation(adminId: string, donationId: string, mealsServed: number) {
  const ok = await transitionDonation(donationId, "COMPLETED", {
    actorId: adminId,
    mealsServed,
    note: `${mealsServed} meals served (recorded by FoodBridge)`,
  });
  if (ok) await log(adminId, "complete", "donation", donationId, `${mealsServed} meals served`);
  return ok;
}

/* ------------------------------------------------------------ activity */

export type ActivityFilters = AdminFilters & { type?: ActivityLogEntry["targetType"] };

/** The platform activity log: admin decisions, data exports and sign-in/security events. */
export async function listActivity(f: ActivityFilters, limit = 100) {
  const db = await getDb();
  const q = f.q?.trim();
  const targetUser = alias(users, "target_user");
  const targetDonation = alias(donations, "target_donation");
  const requestDonation = alias(donations, "request_donation");
  return db
    .select({
      id: activityLog.id,
      action: activityLog.action,
      targetType: activityLog.targetType,
      targetId: activityLog.targetId,
      note: activityLog.note,
      createdAt: activityLog.createdAt,
      actorName: actor.name,
      actorRole: actor.role,
      // A readable name for what the entry is about, whichever table it lives in.
      targetLabel: sql<string | null>`coalesce(
        ${targetUser.organizationName}, ${targetUser.name},
        ${targetDonation.foodType},
        ${requestDonation.foodType},
        (select coalesce(${foodNeeds.foodType}, ${foodNeeds.area}) from ${foodNeeds} where ${foodNeeds.id} = ${activityLog.targetId})
      )`,
      requestDonationId: requestDonation.id,
    })
    .from(activityLog)
    .leftJoin(actor, eq(actor.id, activityLog.actorId))
    .leftJoin(targetUser, and(eq(activityLog.targetType, "user"), eq(targetUser.id, activityLog.targetId)))
    .leftJoin(targetDonation, and(eq(activityLog.targetType, "donation"), eq(targetDonation.id, activityLog.targetId)))
    .leftJoin(foodRequests, and(eq(activityLog.targetType, "request"), eq(foodRequests.id, activityLog.targetId)))
    .leftJoin(requestDonation, eq(requestDonation.id, foodRequests.donationId))
    .where(
      and(
        f.status ? eq(activityLog.action, f.status) : undefined,
        f.type ? eq(activityLog.targetType, f.type) : undefined,
        q
          ? or(
              ilike(actor.name, like(q)),
              ilike(activityLog.note, like(q)),
              ilike(targetUser.name, like(q)),
              ilike(targetUser.organizationName, like(q)),
              ilike(targetDonation.foodType, like(q)),
            )
          : undefined,
        ...dateRange(activityLog.createdAt, f),
      ),
    )
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);
}

export type ActivityRow = Awaited<ReturnType<typeof listActivity>>[number];
