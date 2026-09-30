import "server-only";

import { alias } from "drizzle-orm/pg-core";
import { and, desc, eq, gte, ilike, lte, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { donations, users, type DonationStatus, type DonorType } from "@/db/schema";
import { mealsCounted } from "@/lib/donations/service";

/*
 * Reports (Segment 18): simple aggregate tables over donations, the platform's central record.
 * Every number is computed from structured rows (status + timestamps), so the same queries can
 * feed CSV exports, the NGO report and later analytics or AI features.
 */

const TIMEZONE = process.env.APP_TIMEZONE ?? "Asia/Dhaka";
const donor = alias(users, "donor");

export type ReportFilters = {
  from?: Date;
  to?: Date;
  /** Matches the donor's area or the pickup address. */
  location?: string;
  donorType?: DonorType;
  status?: DonationStatus;
  /** Restricts the report to food delivered to one NGO (the NGO's own report). */
  ngoId?: string;
};

export type ReportRow = {
  key: string;
  posted: number;
  postedMeals: number;
  delivered: number;
  mealsDelivered: number;
  mealsServed: number;
  expired: number;
  expiredMeals: number;
  cancelled: number;
};

const like = (value: string) => `%${value.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

export function reportWhere(f: ReportFilters): SQL | undefined {
  return and(
    f.from ? gte(donations.createdAt, f.from) : undefined,
    f.to ? lte(donations.createdAt, f.to) : undefined,
    f.location ? or(ilike(donor.area, like(f.location)), ilike(donations.pickupAddress, like(f.location))) : undefined,
    f.donorType ? eq(donor.donorType, f.donorType) : undefined,
    f.status ? eq(donations.status, f.status) : undefined,
    f.ngoId ? eq(donations.ngoId, f.ngoId) : undefined,
  );
}

const measures = {
  posted: sql<number>`count(*)`.mapWith(Number),
  postedMeals: sql<number>`coalesce(sum(${donations.mealsEstimate}), 0)`.mapWith(Number),
  delivered: sql<number>`count(*) filter (where ${donations.status} in ('DELIVERED', 'COMPLETED'))`.mapWith(Number),
  mealsDelivered: sql<number>`coalesce(sum(${mealsCounted}) filter (where ${donations.status} in ('DELIVERED', 'COMPLETED')), 0)`.mapWith(Number),
  mealsServed: sql<number>`coalesce(sum(${donations.mealsServed}) filter (where ${donations.status} = 'COMPLETED'), 0)`.mapWith(Number),
  expired: sql<number>`count(*) filter (where ${donations.status} = 'EXPIRED')`.mapWith(Number),
  expiredMeals: sql<number>`coalesce(sum(${donations.mealsEstimate}) filter (where ${donations.status} = 'EXPIRED'), 0)`.mapWith(Number),
  cancelled: sql<number>`count(*) filter (where ${donations.status} = 'CANCELLED')`.mapWith(Number),
};

async function grouped(f: ReportFilters, key: SQL<string>, order: "key" | "posted", limit: number): Promise<ReportRow[]> {
  const db = await getDb();
  return db
    .select({ key, ...measures })
    .from(donations)
    .innerJoin(donor, eq(donor.id, donations.donorId))
    .where(reportWhere(f))
    .groupBy(sql`1`)
    .orderBy(order === "key" ? desc(sql`1`) : desc(measures.posted))
    .limit(limit);
}

export type Report = {
  summary: ReportRow;
  byMonth: ReportRow[];
  byArea: ReportRow[];
  byDonorType: ReportRow[];
  byCategory: ReportRow[];
};

/** Summary plus breakdowns by month, area, donor type and food category, for the filtered donations. */
export async function getReport(f: ReportFilters): Promise<Report> {
  const [summary, byMonth, byArea, byDonorType, byCategory] = await Promise.all([
    grouped(f, sql<string>`'all'`, "key", 1),
    grouped(f, sql<string>`to_char(date_trunc('month', ${donations.createdAt} at time zone ${TIMEZONE}), 'YYYY-MM')`, "key", 24),
    grouped(f, sql<string>`coalesce(nullif(trim(${donor.area}), ''), 'Not set')`, "posted", 25),
    grouped(f, sql<string>`coalesce(${donor.donorType}, 'other')`, "posted", 10),
    grouped(f, sql<string>`${donations.category}`, "posted", 10),
  ]);
  const empty: ReportRow = { key: "all", posted: 0, postedMeals: 0, delivered: 0, mealsDelivered: 0, mealsServed: 0, expired: 0, expiredMeals: 0, cancelled: 0 };
  return { summary: summary[0] ?? empty, byMonth, byArea, byDonorType, byCategory };
}

export { donor as reportDonor };
