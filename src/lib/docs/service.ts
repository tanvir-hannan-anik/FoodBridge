import "server-only";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { docsSettings } from "@/db/schema";
import { getAdminStats, recentActivity } from "@/lib/admin/service";
import { defaultDocs, docsSchema, type DocsContent } from "./model";

export async function readDocs() {
  const db = await getDb();
  const [row] = await db.select().from(docsSettings).where(eq(docsSettings.id, 1));
  return { content: row ? docsSchema.parse(JSON.parse(row.content)) : defaultDocs, revision: row?.revision ?? 0, updatedAt: row?.updatedAt.toISOString() ?? null };
}

/** Caller must authenticate an admin. Revision checks prevent silent concurrent overwrites. */
export async function writeDocs(content: DocsContent, revision: number) {
  const db = await getDb();
  const values = { content: JSON.stringify(docsSchema.parse(content)), updatedAt: new Date() };
  const rows = revision === 0
    ? await db.insert(docsSettings).values({ id: 1, ...values }).onConflictDoNothing().returning()
    : await db.update(docsSettings).set({ ...values, revision: sql`${docsSettings.revision} + 1` }).where(sql`${docsSettings.id} = 1 and ${docsSettings.revision} = ${revision}`).returning();
  return rows.length > 0;
}

export async function docsMetrics() {
  const [stats, events] = await Promise.all([getAdminStats(), recentActivity(8)]);
  return { at: new Date().toISOString(), demo: process.env.DEMO_MODE === "true", users: stats.users.total,
    donors: stats.users.donors, ngos: stats.users.ngos, volunteers: stats.users.volunteers,
    donations: stats.donations.total, delivered: stats.donations.delivered, meals: stats.donations.meals,
    events: events.map((e) => ({ status: e.status, at: e.createdAt.toISOString() })) };
}
