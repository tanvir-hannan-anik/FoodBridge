import "server-only";

import { alias } from "drizzle-orm/pg-core";
import { and, eq, gt, inArray, isNotNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { donations, users, type User } from "@/db/schema";
import { LIVE_STATUSES } from "@/lib/donations/meta";
import { toPoint, type LatLng } from "@/lib/geo";
import type { I18n } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { listOpenTasks, listVolunteerTasks } from "@/lib/volunteer/service";
import type { OverviewLayer, OverviewMapData, OverviewPoint } from "./meta";

/*
 * The "Map" page for each role: who and what is where.
 * - volunteer: pickups they can take or already hold, and where each goes (pickup → NGO)
 * - NGO: donors, available food and volunteers around it (plus deliveries coming to it)
 * - admin: every donor, NGO and volunteer with a pin, and active deliveries
 * - donor: their open donations, and the NGO and volunteer on their deliveries
 * Private homes (individual donors, volunteers) are shown only approximately (~1 km) to other
 * users (admins see exact pins). A volunteer on your delivery shows only from a recent device position.
 */

const donor = alias(users, "donor");
const ngo = alias(users, "ngo");
const volunteer = alias(users, "volunteer");

/** ~1 km grid, enough to see "who is nearby" without revealing a home address. */
function blur(p: LatLng): LatLng {
  return { lat: Math.round(p.lat * 100) / 100, lng: Math.round(p.lng * 100) / 100 };
}

const displayName = (u: { organizationName: string | null; name: string }) => u.organizationName ?? u.name;

async function pinnedUsers(roles: User["role"][], includePending = false) {
  const db = await getDb();
  return db
    .select({
      id: users.id,
      role: users.role,
      status: users.status,
      name: users.name,
      organizationName: users.organizationName,
      donorType: users.donorType,
      area: users.area,
      available: users.available,
      lat: users.lat,
      lng: users.lng,
      locatedAt: users.locatedAt,
    })
    .from(users)
    .where(
      and(
        inArray(users.role, roles),
        isNotNull(users.lat),
        isNotNull(users.lng),
        includePending ? inArray(users.status, ["active", "pending"]) : eq(users.status, "active"),
      ),
    );
}

/** Active deliveries (allocated → in transit) with their pickup and delivery points. */
async function activeDeliveries(scope: { ngoId?: string; donorId?: string }) {
  const db = await getDb();
  return db
    .select({
      id: donations.id,
      status: donations.status,
      foodType: donations.foodType,
      pickupLat: sql<number | null>`coalesce(${donations.pickupLat}, ${donor.lat})`,
      pickupLng: sql<number | null>`coalesce(${donations.pickupLng}, ${donor.lng})`,
      deliveryLat: sql<number | null>`coalesce(${donations.deliveryLat}, ${ngo.lat})`,
      deliveryLng: sql<number | null>`coalesce(${donations.deliveryLng}, ${ngo.lng})`,
      donorName: sql<string>`coalesce(${donor.organizationName}, ${donor.name})`,
      ngoId: donations.ngoId,
      ngoName: sql<string | null>`coalesce(${ngo.organizationName}, ${ngo.name})`,
      volunteerId: donations.volunteerId,
      volunteerName: volunteer.name,
      volunteerLat: volunteer.lat,
      volunteerLng: volunteer.lng,
      volunteerLocatedAt: volunteer.locatedAt,
    })
    .from(donations)
    .innerJoin(donor, eq(donor.id, donations.donorId))
    .leftJoin(ngo, eq(ngo.id, donations.ngoId))
    .leftJoin(volunteer, eq(volunteer.id, donations.volunteerId))
    .where(
      and(
        inArray(donations.status, ["MATCHED", ...LIVE_STATUSES]),
        scope.ngoId ? eq(donations.ngoId, scope.ngoId) : undefined,
        scope.donorId ? eq(donations.donorId, scope.donorId) : undefined,
      ),
    )
    .limit(200);
}

/** Food still waiting for an NGO (PENDING, not expired). */
async function availableFood(scope: { donorId?: string } = {}) {
  const db = await getDb();
  return db
    .select({
      id: donations.id,
      foodType: donations.foodType,
      quantity: donations.quantity,
      unit: donations.unit,
      expiresAt: donations.expiresAt,
      lat: sql<number | null>`coalesce(${donations.pickupLat}, ${donor.lat})`,
      lng: sql<number | null>`coalesce(${donations.pickupLng}, ${donor.lng})`,
      donorName: sql<string>`coalesce(${donor.organizationName}, ${donor.name})`,
    })
    .from(donations)
    .innerJoin(donor, eq(donor.id, donations.donorId))
    .where(
      and(
        eq(donations.status, "PENDING"),
        gt(donations.expiresAt, new Date()),
        or(isNotNull(donations.pickupLat), isNotNull(donor.lat)),
        scope.donorId ? eq(donations.donorId, scope.donorId) : undefined,
      ),
    )
    .limit(300);
}

type Delivery = Awaited<ReturnType<typeof activeDeliveries>>[number];

/** A volunteer's device position this recent is shown to the donor and NGO of their delivery. */
const FRESH_POSITION_MS = 60 * 60_000;

/**
 * Pickup, delivery point and volunteer of one delivery. `volunteer: "any"` (admins) shows the
 * volunteer's last known point; "fresh" (donor/NGO) only a recent device position, never a saved home base.
 */
function deliveryPoints(d: Delivery, href: string, volunteerMode: "any" | "fresh", { t }: I18n) {
  const points: OverviewPoint[] = [];
  const pickup = toPoint(d.pickupLat, d.pickupLng);
  const drop = toPoint(d.deliveryLat, d.deliveryLng);
  if (pickup) points.push({ id: `pickup-${d.id}`, layer: "donation", point: pickup, title: t("{name} · pickup", { name: d.foodType }), subtitle: d.donorName, href });
  if (drop) {
    points.push({ id: `drop-${d.id}`, layer: "ngo", point: drop, title: t("{name} · delivery", { name: d.ngoName ?? t("NGO") }), subtitle: d.foodType, href });
  }
  const v = toPoint(d.volunteerLat, d.volunteerLng);
  const fresh = !!d.volunteerLocatedAt && Date.now() - d.volunteerLocatedAt.getTime() < FRESH_POSITION_MS;
  if (v && d.volunteerId && (volunteerMode === "any" || fresh)) {
    points.push({ id: `vol-${d.id}`, layer: "volunteer", point: v, title: d.volunteerName ?? t("Volunteer"), subtitle: t("Carrying {food}", { food: d.foodType }), href });
  }
  return points;
}

function routeOf(d: { pickupLat: number | null; pickupLng: number | null; deliveryLat: number | null; deliveryLng: number | null }) {
  const a = toPoint(d.pickupLat, d.pickupLng);
  const b = toPoint(d.deliveryLat, d.deliveryLng);
  return a && b ? [a, b] : null;
}

function dedupe(points: OverviewPoint[]) {
  const seen = new Set<string>();
  return points.filter((p) => !seen.has(p.id) && seen.add(p.id));
}

export async function getOverviewMap(user: User): Promise<OverviewMapData> {
  const i18n = await getI18n();
  const tr = i18n.t;
  const me = toPoint(user.lat, user.lng);
  const points: OverviewPoint[] = [];
  const routes: LatLng[][] = [];

  if (user.role === "admin") {
    const [people, deliveries, food] = await Promise.all([pinnedUsers(["donor", "ngo", "volunteer"], true), activeDeliveries({}), availableFood()]);
    for (const u of people) {
      const layer: OverviewLayer = u.role === "donor" ? "donor" : u.role === "ngo" ? "ngo" : "volunteer";
      points.push({
        id: `user-${u.id}`,
        layer,
        point: { lat: u.lat!, lng: u.lng! },
        title: displayName(u),
        subtitle: [
          u.area,
          u.status === "pending" ? tr("awaiting verification") : null,
          u.role === "volunteer" ? tr(u.available ? "available" : "offline") : null,
        ]
          .filter(Boolean)
          .join(" · "),
        href: `/admin/users/${u.id}`,
      });
    }
    for (const f of food) {
      const p = toPoint(f.lat, f.lng);
      if (p) points.push({ id: `food-${f.id}`, layer: "donation", point: p, title: f.foodType, subtitle: tr("Available · {donor}", { donor: f.donorName }), href: `/admin/donations/${f.id}` });
    }
    for (const d of deliveries) {
      points.push(...deliveryPoints(d, `/admin/donations/${d.id}`, "any", i18n));
      const r = routeOf(d);
      if (r) routes.push(r);
    }
    return { role: user.role, me: null, points: dedupe(points), routes, layers: ["donor", "ngo", "volunteer", "donation"] };
  }

  if (user.role === "ngo") {
    const [donorsAndVolunteers, food, deliveries] = await Promise.all([
      pinnedUsers(["donor", "volunteer"]),
      availableFood(),
      activeDeliveries({ ngoId: user.id }),
    ]);
    for (const u of donorsAndVolunteers) {
      const p = { lat: u.lat!, lng: u.lng! };
      if (u.role === "donor") {
        const home = u.donorType === "individual";
        points.push({
          id: `user-${u.id}`,
          layer: "donor",
          point: home ? blur(p) : p,
          title: home ? tr("Household donor") : displayName(u),
          subtitle: [u.area, home ? tr("approximate area") : null].filter(Boolean).join(" · "),
          approximate: home,
        });
      } else {
        // Available volunteers nearby, approximate. Those on my deliveries also appear with the delivery.
        if (!u.available) continue;
        points.push({
          id: `user-${u.id}`,
          layer: "volunteer",
          point: blur(p),
          title: tr("Volunteer"),
          subtitle: [u.area, tr("available"), tr("approximate area")].filter(Boolean).join(" · "),
          approximate: true,
        });
      }
    }
    for (const f of food) {
      const p = toPoint(f.lat, f.lng);
      if (p) points.push({ id: `food-${f.id}`, layer: "donation", point: p, title: f.foodType, subtitle: `${i18n.number(f.quantity)} ${tr(f.unit)} · ${f.donorName}`, href: `/ngo/donations/${f.id}` });
    }
    for (const d of deliveries) {
      points.push(...deliveryPoints(d, `/ngo/donations/${d.id}`, "fresh", i18n));
      const r = routeOf(d);
      if (r) routes.push(r);
    }
    return { role: user.role, me, points: dedupe(points), routes, layers: ["donor", "donation", "volunteer", "ngo"] };
  }

  if (user.role === "volunteer") {
    if (user.status !== "active") return { role: user.role, me, points: [], routes: [], layers: ["donation", "ngo"] };
    const [open, current] = await Promise.all([listOpenTasks(user, 50), listVolunteerTasks(user, "current")]);
    for (const t of [...current, ...open]) {
      const pickup = toPoint(t.pickupLat, t.pickupLng);
      const drop = toPoint(t.deliveryLat, t.deliveryLng);
      const mine = current.includes(t);
      const href = `/volunteer/tasks/${t.id}`;
      if (pickup) {
        points.push({
          id: `pickup-${t.id}`,
          layer: "donation",
          point: pickup,
          title: tr("{name} · pickup", { name: t.donorName }),
          subtitle: `${t.foodType} · ${tr(mine ? "your task" : t.offerStatus === "OFFERED" ? "assigned to you" : "open")}`,
          href,
        });
      }
      if (drop) {
        points.push({ id: `drop-${t.id}`, layer: "ngo", point: drop, title: tr("{name} · delivery", { name: t.ngoName ?? tr("NGO") }), subtitle: t.foodType, href });
      }
      if (pickup && drop) routes.push([pickup, drop]);
    }
    return { role: user.role, me, points: dedupe(points), routes, layers: ["donation", "ngo"] };
  }

  // Donor
  const [mine, deliveries, ngos] = await Promise.all([availableFood({ donorId: user.id }), activeDeliveries({ donorId: user.id }), pinnedUsers(["ngo"])]);
  for (const f of mine) {
    const p = toPoint(f.lat, f.lng);
    if (p) points.push({ id: `food-${f.id}`, layer: "donation", point: p, title: f.foodType, subtitle: tr("Waiting for an NGO"), href: `/donor/donations/${f.id}` });
  }
  for (const d of deliveries) {
    points.push(...deliveryPoints(d, `/donor/donations/${d.id}`, "fresh", i18n));
    const r = routeOf(d);
    if (r) routes.push(r);
  }
  for (const n of ngos) {
    points.push({ id: `user-${n.id}`, layer: "ngo", point: { lat: n.lat!, lng: n.lng! }, title: displayName(n), subtitle: n.area ?? undefined });
  }
  return { role: user.role, me, points: dedupe(points), routes, layers: ["donation", "ngo", "volunteer"] };
}

