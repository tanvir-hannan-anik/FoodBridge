import "server-only";

import { and, eq, gte, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { donationEvents, donations } from "@/db/schema";
import { mealsCounted } from "@/lib/donations/service";
import { dayBoundaryInAppTz } from "@/lib/utils";
import { bucketKeys, bucketLabel, PERIODS, type Activity, type Period } from "./meta";

const TIMEZONE = process.env.APP_TIMEZONE ?? "Asia/Dhaka";

/** Whose activity: one donor, NGO or volunteer, or the whole platform (admin), optionally one area. */
export type ActivityScope = { donorId: string } | { ngoId: string } | { volunteerId: string } | { all: true; area?: string };

function scopeFilter(scope: ActivityScope): SQL | undefined {
  if ("donorId" in scope) return eq(donations.donorId, scope.donorId);
  if ("ngoId" in scope) return eq(donations.ngoId, scope.ngoId);
  if ("volunteerId" in scope) return eq(donations.volunteerId, scope.volunteerId);
  return scope.area ? sql`${donations.pickupAddress} ilike ${`%${scope.area}%`}` : undefined;
}

/** Today's yyyy-mm-dd in the app timezone. */
function todayKey() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/**
 * Activity over a period, bucketed by day/week/month in the app timezone: meals and deliveries
 * (counted when food reached DELIVERED) and donations posted. Plain aggregate queries; no tracking.
 */
export async function getActivity(scope: ActivityScope, period: Period): Promise<Activity> {
  const db = await getDb();
  const { bucket } = PERIODS[period];
  const keys = bucketKeys(period, todayKey());
  const since = dayBoundaryInAppTz(keys[0], "start");
  const where = scopeFilter(scope);
  const key = (column: SQL | typeof donations.createdAt) => sql<string>`to_char(date_trunc(${bucket}, ${column} at time zone ${TIMEZONE}), 'YYYY-MM-DD')`;

  const [delivered, posted] = await Promise.all([
    db
      .select({
        key: key(sql`${donationEvents.createdAt}`),
        meals: sql<number>`coalesce(sum(${mealsCounted}), 0)`.mapWith(Number),
        deliveries: sql<number>`count(distinct ${donations.id})`.mapWith(Number),
      })
      .from(donationEvents)
      .innerJoin(donations, eq(donations.id, donationEvents.donationId))
      .where(and(eq(donationEvents.status, "DELIVERED"), gte(donationEvents.createdAt, since), where))
      .groupBy(sql`1`),
    db
      .select({
        key: key(donations.createdAt),
        posted: sql<number>`count(*)`.mapWith(Number),
        meals: sql<number>`coalesce(sum(${donations.mealsEstimate}), 0)`.mapWith(Number),
        expired: sql<number>`count(*) filter (where ${donations.status} = 'EXPIRED')`.mapWith(Number),
      })
      .from(donations)
      .where(and(gte(donations.createdAt, since), where))
      .groupBy(sql`1`),
  ]);

  const byDelivered = new Map(delivered.map((r) => [r.key, r]));
  const byPosted = new Map(posted.map((r) => [r.key, r]));
  const points = keys.map((k) => ({
    key: k,
    label: bucketLabel(bucket, k),
    meals: byDelivered.get(k)?.meals ?? 0,
    deliveries: byDelivered.get(k)?.deliveries ?? 0,
    posted: byPosted.get(k)?.posted ?? 0,
  }));
  const sum = <T,>(rows: T[], f: (r: T) => number) => rows.reduce((n, r) => n + f(r), 0);
  return {
    period,
    points,
    totals: {
      posted: sum(posted, (r) => r.posted),
      postedMeals: sum(posted, (r) => r.meals),
      deliveries: sum(delivered, (r) => r.deliveries),
      mealsDelivered: sum(delivered, (r) => r.meals),
      expired: sum(posted, (r) => r.expired),
    },
  };
}
