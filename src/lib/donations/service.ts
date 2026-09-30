import "server-only";

import { alias } from "drizzle-orm/pg-core";
import { and, count, desc, eq, gt, inArray, isNull, lt, lte, notExists, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  donationEvents,
  donations,
  foodRequests,
  notifications,
  users,
  type DonationStatus,
  type NotificationType,
} from "@/db/schema";
import { closeTask, offerNextVolunteer, onTaskAccepted, onTaskReleased } from "@/lib/dispatch/service";
import { notify } from "@/lib/notifications/service";
import { ACTIVE_STATUSES, CANCELLABLE, estimateMeals } from "./meta";
import type { donationSchema } from "@/lib/validation";
import type * as z from "zod";

type DonationInput = z.output<typeof donationSchema>;
type DB = Awaited<ReturnType<typeof getDb>>;
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

/** Which status each step may come from. The single source of truth for the workflow. */
const ALLOWED_FROM: Record<DonationStatus, DonationStatus[]> = {
  PENDING: [],
  MATCHED: ["PENDING"],
  ASSIGNED: ["MATCHED"],
  PICKED_UP: ["ASSIGNED"],
  IN_TRANSIT: ["PICKED_UP"],
  // "Start delivery" is optional: a volunteer (or the NGO) may confirm delivery straight after pickup.
  DELIVERED: ["PICKED_UP", "IN_TRANSIT"],
  COMPLETED: ["DELIVERED"],
  CANCELLED: CANCELLABLE,
  EXPIRED: ["PENDING", "MATCHED", "ASSIGNED"],
};

/** Special moves outside the happy path, each allowed only from these states. */
const RELEASE_FROM: DonationStatus[] = ["ASSIGNED"];
const UNMATCH_FROM: DonationStatus[] = ["MATCHED", "ASSIGNED"];

type Notice = Partial<Record<DonationStatus, { type: NotificationType; message: (food: string) => string }>>;

const DONOR_NOTICE: Notice = {
  PENDING: { type: "donation_created", message: (f) => `Your donation “${f}” is live. We’re letting nearby NGOs know.` },
  MATCHED: { type: "matched", message: (f) => `“${f}” is allocated to an NGO. We’re assigning the nearest volunteer.` },
  ASSIGNED: { type: "volunteer_assigned", message: (f) => `A volunteer accepted the pickup of “${f}”.` },
  PICKED_UP: { type: "picked_up", message: (f) => `“${f}” has been picked up and is on its way.` },
  DELIVERED: { type: "delivered", message: (f) => `“${f}” was delivered to the NGO.` },
  COMPLETED: { type: "completed", message: (f) => `“${f}” reached people in need. Thank you for donating!` },
  CANCELLED: { type: "cancelled", message: (f) => `You cancelled “${f}”.` },
  EXPIRED: { type: "expired", message: (f) => `“${f}” expired before pickup.` },
};

/** Sent to the NGO the donation is matched with. */
const NGO_NOTICE: Notice = {
  ASSIGNED: { type: "volunteer_assigned", message: (f) => `A volunteer accepted the pickup of “${f}”.` },
  PICKED_UP: { type: "picked_up", message: (f) => `“${f}” was picked up from the donor.` },
  IN_TRANSIT: { type: "in_transit", message: (f) => `“${f}” is on the way to you. You can follow it on the map.` },
  DELIVERED: { type: "delivered", message: (f) => `“${f}” was delivered. Mark it distributed once it’s served.` },
  CANCELLED: { type: "cancelled", message: (f) => `The donor cancelled “${f}”.` },
  EXPIRED: { type: "expired", message: (f) => `“${f}” expired before it could be picked up.` },
};

/** Sent to the volunteer carrying the donation. */
const VOLUNTEER_NOTICE: Notice = {
  ASSIGNED: { type: "task_accepted", message: (f) => `You accepted the pickup of “${f}”. Head to the donor at pickup time.` },
  PICKED_UP: { type: "picked_up", message: (f) => `Pickup confirmed for “${f}”. Deliver it to the NGO.` },
  DELIVERED: { type: "delivered", message: (f) => `Delivery completed for “${f}”. Thank you for volunteering!` },
  CANCELLED: { type: "cancelled", message: (f) => `The donor cancelled “${f}”. No pickup needed.` },
  EXPIRED: { type: "expired", message: (f) => `“${f}” expired before pickup. The task is closed.` },
};

/** Statuses that end the delivery task: offers are withdrawn and live locations deleted. */
const TASK_ENDS: DonationStatus[] = ["DELIVERED", "COMPLETED", "CANCELLED", "EXPIRED"];

export { notify } from "@/lib/notifications/service";

/* ------------------------------------------------------------------ writes */

export async function createDonation(
  donorId: string,
  input: DonationInput,
  image: { data: Buffer; type: string } | null,
) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(donations)
      .values({
        donorId,
        ...input,
        mealsEstimate: estimateMeals(input.quantity, input.unit),
        imageData: image?.data ?? null,
        imageType: image?.type ?? null,
      })
      .returning({ id: donations.id });
    await tx.insert(donationEvents).values({ donationId: row.id, status: "PENDING", actorId: donorId });
    const notice = DONOR_NOTICE.PENDING!;
    await notify(tx, donorId, row.id, notice.type, notice.message(input.foodType));
    return row.id;
  });
}

/** Where and by when the food must be delivered: fixed when the donation is allocated. */
export type DeliverySnapshot = { address: string | null; lat: number | null; lng: number | null; deliverBy: Date | null };

type TransitionOpts = {
  actorId?: string;
  note?: string;
  ngoId?: string;
  volunteerId?: string;
  mealsServed?: number;
  photo?: { data: Buffer; type: string } | null;
  /** MATCHED only: the delivery task's destination and deadline. */
  delivery?: DeliverySnapshot;
  restrictToDonor?: string;
  restrictToNgo?: string;
  restrictToVolunteer?: string;
  /** The FoodBridge team (admin) did this: notices say so instead of "you cancelled". */
  byAdmin?: boolean;
  /** ASSIGNED → MATCHED: the volunteer hands the task back (or an admin takes it away); it's offered to the next one. */
  releaseVolunteer?: boolean;
  /** MATCHED/ASSIGNED → PENDING: the NGO or an admin cancels the allocation, so the food is available again. */
  unmatch?: boolean;
};

/** Steps that commit someone to the food. Refused once it's past best-before, or while an admin safety hold is on. */
const NEEDS_FRESH_FOOD: DonationStatus[] = ["MATCHED", "ASSIGNED"];

/**
 * Moves a donation to `to` if (and only if) it is currently in an allowed state, inside an
 * existing transaction. Records the timeline, notifies donor, matched NGO and volunteer,
 * offers newly allocated food to the nearest available volunteer, and closes any still-open
 * NGO requests (and system matches) when the donation is cancelled or expires.
 */
export async function transitionInTx(tx: Tx, donationId: string, to: DonationStatus, opts: TransitionOpts = {}) {
  const release = to === "MATCHED" && opts.releaseVolunteer === true;
  const unmatch = to === "PENDING" && opts.unmatch === true;
  if (to === "PENDING" && !unmatch) return false;

  let before: { volunteerId: string | null; ngoId: string | null } | null = null;
  if (release || unmatch) {
    const [row] = await tx
      .select({ volunteerId: donations.volunteerId, ngoId: donations.ngoId })
      .from(donations)
      .where(eq(donations.id, donationId));
    before = row ?? null;
  }
  const from = release ? RELEASE_FROM : unmatch ? UNMATCH_FROM : ALLOWED_FROM[to];

  const [updated] = await tx
    .update(donations)
    .set({
      status: to,
      updatedAt: new Date(),
      ...(opts.ngoId && { ngoId: opts.ngoId }),
      ...(opts.volunteerId && { volunteerId: opts.volunteerId }),
      ...(opts.delivery && {
        deliveryAddress: opts.delivery.address,
        deliveryLat: opts.delivery.lat,
        deliveryLng: opts.delivery.lng,
        deliverBy: opts.delivery.deliverBy,
      }),
      ...(release && { volunteerId: null }),
      ...(unmatch && { ngoId: null, volunteerId: null, deliveryAddress: null, deliveryLat: null, deliveryLng: null, deliverBy: null }),
      ...(opts.mealsServed && { mealsServed: opts.mealsServed }),
      ...(to === "CANCELLED" && { cancelReason: opts.note ?? null }),
    })
    .where(
      and(
        eq(donations.id, donationId),
        inArray(donations.status, from),
        NEEDS_FRESH_FOOD.includes(to) && !release ? gt(donations.expiresAt, new Date()) : undefined,
        NEEDS_FRESH_FOOD.includes(to) && !release ? isNull(donations.safetyFlag) : undefined,
        opts.restrictToDonor ? eq(donations.donorId, opts.restrictToDonor) : undefined,
        opts.restrictToNgo ? eq(donations.ngoId, opts.restrictToNgo) : undefined,
        opts.restrictToVolunteer ? eq(donations.volunteerId, opts.restrictToVolunteer) : undefined,
      ),
    )
    .returning({
      donorId: donations.donorId,
      ngoId: donations.ngoId,
      volunteerId: donations.volunteerId,
      foodType: donations.foodType,
    });
  if (!updated) return false;

  await tx.insert(donationEvents).values({
    donationId,
    status: to,
    note: opts.note,
    actorId: opts.actorId,
    photoData: opts.photo?.data ?? null,
    photoType: opts.photo?.type ?? null,
  });

  const food = updated.foodType;
  const reason = opts.note ? ` Reason: ${opts.note}` : "";
  if (release) {
    const gone = before?.volunteerId ?? null;
    if (gone) {
      await onTaskReleased(tx, donationId, gone, opts.note);
      const message =
        opts.actorId === gone
          ? `You handed back the pickup of “${food}”. Thanks for letting us know.`
          : `You’ve been taken off the pickup of “${food}”. No need to collect it.`;
      await notify(tx, gone, donationId, "cancelled", message);
    }
    const changed = `The volunteer for “${food}” changed. We’re assigning another one.`;
    if (updated.ngoId) await notify(tx, updated.ngoId, donationId, "matched", changed);
    await notify(tx, updated.donorId, donationId, "matched", changed);
  } else if (unmatch) {
    const by = opts.byAdmin ? "FoodBridge" : "The NGO";
    await notify(tx, updated.donorId, donationId, "match_cancelled", `${by} cancelled the match for “${food}”. It’s available again.${reason}`);
    if (before?.ngoId && opts.byAdmin) {
      await notify(tx, before.ngoId, donationId, "match_cancelled", `FoodBridge cancelled your match for “${food}”.${reason}`);
    }
    if (before?.volunteerId) {
      await notify(tx, before.volunteerId, donationId, "cancelled", `“${food}” no longer needs a pickup. The match was cancelled.`);
    }
  } else {
    const byAdmin = opts.byAdmin && to === "CANCELLED";
    const donorNotice = DONOR_NOTICE[to];
    if (donorNotice) {
      const message = byAdmin ? `FoodBridge cancelled your donation “${food}”.${reason}` : donorNotice.message(food);
      await notify(tx, updated.donorId, donationId, donorNotice.type, message);
    }
    const ngoNotice = NGO_NOTICE[to];
    if (ngoNotice && updated.ngoId) {
      const message = byAdmin ? `FoodBridge cancelled “${food}”. It won’t be delivered.` : ngoNotice.message(food);
      await notify(tx, updated.ngoId, donationId, ngoNotice.type, message);
    }
    const volunteerNotice = VOLUNTEER_NOTICE[to];
    if (volunteerNotice && updated.volunteerId) {
      const message = byAdmin ? `FoodBridge cancelled “${food}”. No pickup needed.` : volunteerNotice.message(food);
      await notify(tx, updated.volunteerId, donationId, volunteerNotice.type, message);
    }
  }

  // Allocated (or handed back): the pickup task goes to the nearest available volunteer.
  if (to === "MATCHED") await offerNextVolunteer(tx, donationId);
  if (to === "ASSIGNED" && updated.volunteerId) await onTaskAccepted(tx, donationId, updated.volunteerId);
  if (unmatch || TASK_ENDS.includes(to)) await closeTask(tx, donationId);

  // Expired or cancelled food can't be matched any more: close open requests and system matches.
  if (to === "CANCELLED" || to === "EXPIRED") {
    const closed = await tx
      .update(foodRequests)
      .set({ status: to === "CANCELLED" ? "DECLINED" : "EXPIRED", updatedAt: new Date() })
      .where(and(eq(foodRequests.donationId, donationId), inArray(foodRequests.status, ["PENDING", "MATCHED"])))
      .returning({ ngoId: foodRequests.ngoId });
    if (to === "CANCELLED") {
      for (const r of closed) {
        await notify(tx, r.ngoId, donationId, "request_declined", `“${food}” is no longer available. It was cancelled.`);
      }
    }
  }
  return true;
}

export async function transitionDonation(donationId: string, to: DonationStatus, opts: TransitionOpts = {}) {
  const db = await getDb();
  return db.transaction((tx) => transitionInTx(tx, donationId, to, opts));
}

export function cancelDonation(donorId: string, donationId: string, reason?: string) {
  return transitionDonation(donationId, "CANCELLED", {
    actorId: donorId,
    note: reason || undefined,
    restrictToDonor: donorId,
  });
}

/** Volunteer steps, which the demo control can play so a demo doesn't need a second login. */
export const DEMO_STEPS: Partial<Record<DonationStatus, DonationStatus>> = {
  MATCHED: "ASSIGNED",
  ASSIGNED: "PICKED_UP",
  PICKED_UP: "IN_TRANSIT",
  IN_TRANSIT: "DELIVERED",
};

/**
 * DEMO ONLY: plays the volunteer's part (assign → pick up → deliver) using the seeded
 * volunteer account, or the volunteer already assigned. Callable by the donation's donor or its matched NGO.
 */
export async function advanceDonationDemo(actor: { donorId?: string; ngoId?: string }, donationId: string) {
  const db = await getDb();
  const [donation] = await db
    .select({ status: donations.status, donorId: donations.donorId, ngoId: donations.ngoId })
    .from(donations)
    .where(eq(donations.id, donationId));
  if (!donation) return false;
  const allowed =
    (actor.donorId && donation.donorId === actor.donorId) || (actor.ngoId && donation.ngoId === actor.ngoId);
  const next = DEMO_STEPS[donation.status];
  if (!allowed || !next) return false;

  if (next === "ASSIGNED") {
    const [volunteer] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, "volunteer"), eq(users.status, "active")))
      .orderBy(users.createdAt)
      .limit(1);
    return !!volunteer && transitionDonation(donationId, next, { actorId: volunteer.id, volunteerId: volunteer.id });
  }
  return transitionDonation(donationId, next);
}

/** Marks donations past best-before that were never picked up as EXPIRED (optionally for one donor). */
export async function expireOverdueDonations(scope: { donorId?: string } = {}) {
  const db = await getDb();
  const overdue = await db
    .select({ id: donations.id })
    .from(donations)
    .where(
      and(
        inArray(donations.status, ALLOWED_FROM.EXPIRED),
        lt(donations.expiresAt, new Date()),
        scope.donorId ? eq(donations.donorId, scope.donorId) : undefined,
      ),
    );
  for (const { id } of overdue) await transitionDonation(id, "EXPIRED", { note: "Best-before time passed." });
}

/**
 * Lazy housekeeping, run when a donor opens their pages (no cron needed):
 * - donations past best-before that were never picked up become EXPIRED
 * - donations expiring within the hour get a one-time warning notification
 */
export async function sweepDonorDonations(donorId: string) {
  const db = await getDb();
  const now = new Date();
  await expireOverdueDonations({ donorId });

  const soon = await db
    .select({ id: donations.id, foodType: donations.foodType })
    .from(donations)
    .where(
      and(
        eq(donations.donorId, donorId),
        inArray(donations.status, ALLOWED_FROM.EXPIRED),
        gt(donations.expiresAt, now),
        lte(donations.expiresAt, new Date(now.getTime() + 60 * 60_000)),
        notExists(
          db
            .select({ one: sql`1` })
            .from(notifications)
            .where(and(eq(notifications.donationId, donations.id), eq(notifications.type, "expiry_warning"))),
        ),
      ),
    );
  if (soon.length) {
    await db.insert(notifications).values(
      soon.map((d) => ({
        userId: donorId,
        donationId: d.id,
        type: "expiry_warning" as const,
        message: `“${d.foodType}” expires within an hour and hasn’t been picked up yet.`,
      })),
    );
  }
}

/* ------------------------------------------------------------------- reads */

/** Meals counted for a completed donation: what the NGO reported, else our estimate. */
export const mealsCounted = sql<number>`coalesce(${donations.mealsServed}, ${donations.mealsEstimate})`;

export async function getDonorStats(donorId: string) {
  const db = await getDb();
  const [row] = await db
    .select({
      active: sql<number>`count(*) filter (where ${inArray(donations.status, ACTIVE_STATUSES)})`.mapWith(Number),
      completed: sql<number>`count(*) filter (where ${donations.status} = 'COMPLETED')`.mapWith(Number),
      meals: sql<number>`coalesce(sum(${mealsCounted}) filter (where ${donations.status} = 'COMPLETED'), 0)`.mapWith(
        Number,
      ),
      total: count(),
    })
    .from(donations)
    .where(eq(donations.donorId, donorId));
  return row;
}

const listColumns = {
  id: donations.id,
  foodType: donations.foodType,
  category: donations.category,
  quantity: donations.quantity,
  unit: donations.unit,
  status: donations.status,
  expiresAt: donations.expiresAt,
  pickupAt: donations.pickupAt,
  createdAt: donations.createdAt,
  mealsEstimate: donations.mealsEstimate,
  safetyFlag: donations.safetyFlag,
  pendingRequests: sql<number>`(select count(*) from ${foodRequests} where ${foodRequests.donationId} = ${donations.id} and ${foodRequests.status} = 'PENDING')`.mapWith(
    Number,
  ),
};

export type DonationListItem = Awaited<ReturnType<typeof listDonorDonations>>[number];

export async function listDonorDonations(donorId: string, filter: "active" | "completed" | "all" = "all", limit = 50) {
  const db = await getDb();
  const statusFilter =
    filter === "active"
      ? inArray(donations.status, ACTIVE_STATUSES)
      : filter === "completed"
        ? eq(donations.status, "COMPLETED")
        : undefined;
  return db
    .select(listColumns)
    .from(donations)
    .where(and(eq(donations.donorId, donorId), statusFilter))
    .orderBy(desc(donations.createdAt))
    .limit(limit);
}

export async function getDonorDonation(donorId: string, donationId: string) {
  const db = await getDb();
  const ngo = alias(users, "ngo");
  const volunteer = alias(users, "volunteer");
  const [row] = await db
    .select({
      donation: {
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
        pickupLat: donations.pickupLat,
        pickupLng: donations.pickupLng,
        contactName: donations.contactName,
        contactPhone: donations.contactPhone,
        instructions: donations.instructions,
        hasImage: sql<boolean>`${donations.imageData} is not null`,
        status: donations.status,
        cancelReason: donations.cancelReason,
        createdAt: donations.createdAt,
        parentId: donations.parentId,
        safetyFlag: donations.safetyFlag,
        safetyNote: donations.safetyNote,
        deliveryAddress: donations.deliveryAddress,
        deliverBy: donations.deliverBy,
      },
      ngo: { name: ngo.organizationName, contact: ngo.name, phone: ngo.phone },
      volunteer: { name: volunteer.name, phone: volunteer.phone },
    })
    .from(donations)
    .leftJoin(ngo, eq(ngo.id, donations.ngoId))
    .leftJoin(volunteer, eq(volunteer.id, donations.volunteerId))
    .where(and(eq(donations.id, donationId), eq(donations.donorId, donorId)))
    .limit(1);
  if (!row) return null;

  const [events, requests] = await Promise.all([
    db
      .select({ status: donationEvents.status, note: donationEvents.note, createdAt: donationEvents.createdAt })
      .from(donationEvents)
      .where(eq(donationEvents.donationId, donationId))
      .orderBy(donationEvents.createdAt),
    db
      .select({
        id: foodRequests.id,
        quantity: foodRequests.quantity,
        people: foodRequests.people,
        preferredAt: foodRequests.preferredAt,
        notes: foodRequests.notes,
        createdAt: foodRequests.createdAt,
        ngoName: users.organizationName,
        ngoContact: users.name,
        ngoArea: users.area,
        ngoType: users.ngoType,
        ngoLat: users.lat,
        ngoLng: users.lng,
      })
      .from(foodRequests)
      .innerJoin(users, eq(users.id, foodRequests.ngoId))
      .where(and(eq(foodRequests.donationId, donationId), eq(foodRequests.status, "PENDING")))
      .orderBy(foodRequests.createdAt),
  ]);

  return {
    ...row.donation,
    ngo: row.ngo?.contact ? row.ngo : null,
    volunteer: row.volunteer?.name ? row.volunteer : null,
    events,
    requests,
  };
}

export async function getDonationImage(donationId: string) {
  const db = await getDb();
  const [row] = await db
    .select({ data: donations.imageData, type: donations.imageType })
    .from(donations)
    .where(eq(donations.id, donationId));
  return row?.data && row.type ? { data: row.data, type: row.type } : null;
}

export async function isDonationOwner(donorId: string, donationId: string) {
  const db = await getDb();
  const [row] = await db
    .select({ id: donations.id })
    .from(donations)
    .where(and(eq(donations.id, donationId), eq(donations.donorId, donorId)));
  return !!row;
}

/* ------------------------------------------------------------------ public */

export async function getPublicImpact() {
  const db = await getDb();
  const [row] = await db
    .select({
      meals: sql<number>`coalesce(sum(${mealsCounted}), 0)`.mapWith(Number),
      completed: count(),
    })
    .from(donations)
    .where(eq(donations.status, "COMPLETED"));
  const [donors] = await db.select({ n: count() }).from(users).where(eq(users.role, "donor"));
  const [partners] = await db
    .select({ n: count() })
    .from(users)
    .where(and(inArray(users.role, ["ngo", "volunteer"]), eq(users.status, "active")));
  return { meals: row.meals, completed: row.completed, donors: donors.n, partners: partners.n };
}
