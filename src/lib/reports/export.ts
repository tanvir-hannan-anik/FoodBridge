import "server-only";

import { alias, type AnyPgColumn } from "drizzle-orm/pg-core";
import { and, desc, eq, gte, ilike, lte, ne, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { donationEvents, donations, foodNeeds, users } from "@/db/schema";
import { toCsv } from "@/lib/csv";
import { mealsCounted } from "@/lib/donations/service";
import type { ExportDataset, ReportQuery } from "./meta";
import { getReport, reportDonor as donor, reportWhere, type ReportRow } from "./service";

/*
 * CSV exports for admins. Only what's needed to review the work is exported: no passwords,
 * photos, exact coordinates, emails, phone numbers or home addresses (areas are used instead).
 */

const MAX_ROWS = 10_000;
const ngo = alias(users, "ngo");
const volunteer = alias(users, "volunteer");
const like = (value: string) => `%${value.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
const eventAt = (status: string) =>
  sql<Date | null>`(select max(${donationEvents.createdAt}) from ${donationEvents} where ${donationEvents.donationId} = ${donations.id} and ${donationEvents.status} = ${status})`.mapWith(
    (v) => (v ? new Date(v) : null),
  );
const name = (t: { organizationName: AnyPgColumn; name: AnyPgColumn }) => sql<string | null>`coalesce(${t.organizationName}, ${t.name})`;

const REPORT_COLUMNS = ["Group", "Value", "Donations posted", "Meals posted", "Delivered", "Meals delivered", "Meals served", "Expired", "Meals expired", "Cancelled"];
const reportLine = (group: string, r: ReportRow) => [group, r.key, r.posted, r.postedMeals, r.delivered, r.mealsDelivered, r.mealsServed, r.expired, r.expiredMeals, r.cancelled];

export async function buildExport(dataset: ExportDataset, q: ReportQuery): Promise<{ csv: string; rows: number }> {
  const db = await getDb();

  if (dataset === "report") {
    const r = await getReport(q);
    const rows = [
      reportLine("Total", r.summary),
      ...r.byMonth.map((x) => reportLine("Month", x)),
      ...r.byArea.map((x) => reportLine("Area", x)),
      ...r.byDonorType.map((x) => reportLine("Donor type", x)),
      ...r.byCategory.map((x) => reportLine("Category", x)),
    ];
    return { csv: toCsv(REPORT_COLUMNS, rows), rows: rows.length };
  }

  if (dataset === "donations" || dataset === "deliveries") {
    const deliveredOnly = dataset === "deliveries";
    const rows = await db
      .select({
        id: donations.id,
        createdAt: donations.createdAt,
        foodType: donations.foodType,
        category: donations.category,
        quantity: donations.quantity,
        unit: donations.unit,
        meals: mealsCounted,
        mealsServed: donations.mealsServed,
        status: donations.status,
        expiresAt: donations.expiresAt,
        donorName: name(donor),
        donorType: donor.donorType,
        area: donor.area,
        ngoName: name(ngo),
        volunteerName: volunteer.name,
        pickedUpAt: eventAt("PICKED_UP"),
        deliveredAt: eventAt("DELIVERED"),
        completedAt: eventAt("COMPLETED"),
      })
      .from(donations)
      .innerJoin(donor, eq(donor.id, donations.donorId))
      .leftJoin(ngo, eq(ngo.id, donations.ngoId))
      .leftJoin(volunteer, eq(volunteer.id, donations.volunteerId))
      .where(and(reportWhere(q), deliveredOnly ? sql`${donations.status} in ('DELIVERED', 'COMPLETED')` : undefined))
      .orderBy(desc(donations.createdAt))
      .limit(MAX_ROWS);

    if (deliveredOnly) {
      const columns = ["Donation ID", "Food", "Meals", "Donor", "Area", "NGO", "Volunteer", "Picked up", "Delivered", "Minutes pickup to delivery", "Completed", "Meals served"];
      return {
        rows: rows.length,
        csv: toCsv(
          columns,
          rows.map((r) => [
            r.id,
            r.foodType,
            r.meals,
            r.donorName,
            r.area,
            r.ngoName,
            r.volunteerName,
            r.pickedUpAt,
            r.deliveredAt,
            r.pickedUpAt && r.deliveredAt ? Math.round((r.deliveredAt.getTime() - r.pickedUpAt.getTime()) / 60_000) : null,
            r.completedAt,
            r.mealsServed,
          ]),
        ),
      };
    }
    const columns = ["Donation ID", "Posted", "Food", "Category", "Quantity", "Unit", "Meals", "Status", "Best before", "Donor", "Donor type", "Area", "NGO", "Volunteer", "Delivered", "Completed", "Meals served"];
    return {
      rows: rows.length,
      csv: toCsv(
        columns,
        rows.map((r) => [
          r.id,
          r.createdAt,
          r.foodType,
          r.category,
          r.quantity,
          r.unit,
          r.meals,
          r.status,
          r.expiresAt,
          r.donorName,
          r.donorType,
          r.area,
          r.ngoName,
          r.volunteerName,
          r.deliveredAt,
          r.completedAt,
          r.mealsServed,
        ]),
      ),
    };
  }

  if (dataset === "requests") {
    const matched = sql<number>`(select count(*) from food_requests fr where fr.need_id = ${foodNeeds.id} and fr.status = 'ACCEPTED')`.mapWith(Number);
    const rows = await db
      .select({
        id: foodNeeds.id,
        createdAt: foodNeeds.createdAt,
        ngoName: name(ngo),
        category: foodNeeds.category,
        foodType: foodNeeds.foodType,
        quantity: foodNeeds.quantity,
        unit: foodNeeds.unit,
        people: foodNeeds.people,
        area: foodNeeds.area,
        neededBy: foodNeeds.neededBy,
        status: foodNeeds.status,
        matched,
      })
      .from(foodNeeds)
      .innerJoin(ngo, eq(ngo.id, foodNeeds.ngoId))
      .where(
        and(
          q.from ? gte(foodNeeds.createdAt, q.from) : undefined,
          q.to ? lte(foodNeeds.createdAt, q.to) : undefined,
          q.location ? or(ilike(foodNeeds.area, like(q.location)), ilike(ngo.area, like(q.location))) : undefined,
        ),
      )
      .orderBy(desc(foodNeeds.createdAt))
      .limit(MAX_ROWS);
    const columns = ["Request ID", "Created", "NGO", "Category", "Food", "Quantity", "Unit", "People", "Area", "Needed by", "Status", "Donations allocated"];
    return {
      rows: rows.length,
      csv: toCsv(
        columns,
        rows.map((r) => [r.id, r.createdAt, r.ngoName, r.category ?? "any", r.foodType, r.quantity, r.unit, r.people, r.area, r.neededBy, r.status, r.matched]),
      ),
    };
  }

  // users
  const activity = sql<number>`case ${users.role}
    when 'donor' then (select count(*) from ${donations} where ${donations.donorId} = ${users.id})
    when 'ngo' then (select count(*) from ${donations} where ${donations.ngoId} = ${users.id} and ${donations.status} in ('DELIVERED', 'COMPLETED'))
    when 'volunteer' then (select count(*) from ${donations} where ${donations.volunteerId} = ${users.id} and ${donations.status} in ('DELIVERED', 'COMPLETED'))
    else 0 end`.mapWith(Number);
  const rows = await db
    .select({
      id: users.id,
      role: users.role,
      donorType: users.donorType,
      ngoType: users.ngoType,
      name: sql<string>`coalesce(${users.organizationName}, ${users.name})`,
      status: users.status,
      area: users.area,
      createdAt: users.createdAt,
      activity,
    })
    .from(users)
    .where(
      and(
        ne(users.role, "admin"),
        q.role ? eq(users.role, q.role) : undefined,
        q.location ? ilike(users.area, like(q.location)) : undefined,
        q.from ? gte(users.createdAt, q.from) : undefined,
        q.to ? lte(users.createdAt, q.to) : undefined,
      ),
    )
    .orderBy(desc(users.createdAt))
    .limit(MAX_ROWS);
  const columns = ["User ID", "Role", "Type", "Name / organisation", "Status", "Area", "Joined", "Donations posted / received / delivered"];
  return {
    rows: rows.length,
    csv: toCsv(
      columns,
      rows.map((r) => [r.id, r.role, r.donorType ?? r.ngoType, r.name, r.status, r.area, r.createdAt, r.activity]),
    ),
  };
}
