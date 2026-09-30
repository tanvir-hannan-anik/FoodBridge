import "server-only";

import { alias } from "drizzle-orm/pg-core";
import { and, eq, gt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { donations, liveLocations, taskOffers, users, type Role, type User } from "@/db/schema";
import { LIVE_STATUSES } from "@/lib/donations/meta";
import { toPoint } from "@/lib/geo";
import { LIVE_FRESH_MINUTES, type DeliveryView, type LivePosition } from "./meta";

const donor = alias(users, "donor");
const ngo = alias(users, "ngo");
const volunteer = alias(users, "volunteer");

/** Saves a user's map pin (profile) or, for volunteers, their current position (one-shot, not tracking). */
export async function setUserLocation(userId: string, point: { lat: number; lng: number } | null, fromDevice = false) {
  const db = await getDb();
  await db
    .update(users)
    .set({ lat: point?.lat ?? null, lng: point?.lng ?? null, locatedAt: fromDevice && point ? new Date() : null, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

/**
 * Everything the delivery map needs: pickup (donor), delivery (NGO) and the volunteer's base,
 * plus who is allowed to see it. Falls back to profile pins when the donation has none.
 */
async function loadDelivery(donationId: string) {
  const db = await getDb();
  const [row] = await db
    .select({
      id: donations.id,
      status: donations.status,
      foodType: donations.foodType,
      donorId: donations.donorId,
      ngoId: donations.ngoId,
      volunteerId: donations.volunteerId,
      pickupAddress: donations.pickupAddress,
      pickupLat: sql<number | null>`coalesce(${donations.pickupLat}, ${donor.lat})`,
      pickupLng: sql<number | null>`coalesce(${donations.pickupLng}, ${donor.lng})`,
      donorName: sql<string>`coalesce(${donor.organizationName}, ${donor.name})`,
      deliveryAddress: sql<string | null>`coalesce(${donations.deliveryAddress}, ${ngo.address}, ${ngo.area})`,
      deliveryLat: sql<number | null>`coalesce(${donations.deliveryLat}, ${ngo.lat})`,
      deliveryLng: sql<number | null>`coalesce(${donations.deliveryLng}, ${ngo.lng})`,
      ngoName: sql<string | null>`coalesce(${ngo.organizationName}, ${ngo.name})`,
      volunteerName: volunteer.name,
      volunteerLat: volunteer.lat,
      volunteerLng: volunteer.lng,
      pendingOffer: sql<boolean>`exists (select 1 from ${taskOffers} o where o.donation_id = ${donations.id} and o.status = 'OFFERED')`,
    })
    .from(donations)
    .innerJoin(donor, eq(donor.id, donations.donorId))
    .leftJoin(ngo, eq(ngo.id, donations.ngoId))
    .leftJoin(volunteer, eq(volunteer.id, donations.volunteerId))
    .where(eq(donations.id, donationId));
  return row ?? null;
}

type Delivery = NonNullable<Awaited<ReturnType<typeof loadDelivery>>>;

/** Who can see a delivery's map: its donor, allocated NGO, assigned volunteer, and admins. */
function participantRole(user: Pick<User, "id" | "role">, d: Delivery): Role | null {
  if (user.role === "admin") return "admin";
  if (user.role === "donor" && d.donorId === user.id) return "donor";
  if (user.role === "ngo" && d.ngoId === user.id) return "ngo";
  if (user.role === "volunteer" && d.volunteerId === user.id) return "volunteer";
  return null;
}

export async function listLivePositions(donationId: string): Promise<LivePosition[]> {
  const db = await getDb();
  const rows = await db
    .select({
      userId: liveLocations.userId,
      lat: liveLocations.lat,
      lng: liveLocations.lng,
      accuracy: liveLocations.accuracy,
      updatedAt: liveLocations.updatedAt,
      role: users.role,
      name: sql<string>`coalesce(${users.organizationName}, ${users.name})`,
    })
    .from(liveLocations)
    .innerJoin(users, eq(users.id, liveLocations.userId))
    .where(
      and(
        eq(liveLocations.donationId, donationId),
        gt(liveLocations.updatedAt, new Date(Date.now() - LIVE_FRESH_MINUTES * 60_000)),
      ),
    );
  return rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() }));
}

/** The map data for one delivery, or null if this user may not see it. */
export async function getDeliveryView(user: Pick<User, "id" | "role">, donationId: string): Promise<DeliveryView | null> {
  const d = await loadDelivery(donationId);
  if (!d) return null;
  const role = participantRole(user, d);
  if (!role) return null;
  const live = LIVE_STATUSES.includes(d.status);
  return {
    donationId: d.id,
    status: d.status,
    viewerId: user.id,
    viewerRole: role,
    live,
    canShare: live && role !== "admin",
    pendingOffer: d.pendingOffer,
    pickup: { point: toPoint(d.pickupLat, d.pickupLng), address: d.pickupAddress, name: d.donorName },
    delivery: d.ngoId ? { point: toPoint(d.deliveryLat, d.deliveryLng), address: d.deliveryAddress, name: d.ngoName ?? "NGO" } : null,
    volunteer: d.volunteerId ? { point: toPoint(d.volunteerLat, d.volunteerLng), name: d.volunteerName ?? "Volunteer" } : null,
    positions: live ? await listLivePositions(d.id) : [],
  };
}

/**
 * Stores the sender's current position for an active delivery. Only participants (not admins)
 * can share, only while the volunteer is on the way (accepted → in transit). Returns false otherwise.
 */
export async function shareLivePosition(user: Pick<User, "id" | "role">, donationId: string, pos: { lat: number; lng: number; accuracy: number | null }) {
  const d = await loadDelivery(donationId);
  if (!d || !LIVE_STATUSES.includes(d.status)) return false;
  const role = participantRole(user, d);
  if (!role || role === "admin") return false;
  const db = await getDb();
  const now = new Date();
  await db
    .insert(liveLocations)
    .values({ donationId, userId: user.id, ...pos, updatedAt: now })
    .onConflictDoUpdate({ target: [liveLocations.donationId, liveLocations.userId], set: { ...pos, updatedAt: now } });
  // The volunteer's latest position also helps route their next task offer.
  if (role === "volunteer") {
    await db.update(users).set({ lat: pos.lat, lng: pos.lng, locatedAt: now }).where(eq(users.id, user.id));
  }
  return true;
}

export async function stopLivePosition(userId: string, donationId: string) {
  const db = await getDb();
  await db.delete(liveLocations).where(and(eq(liveLocations.donationId, donationId), eq(liveLocations.userId, userId)));
}
