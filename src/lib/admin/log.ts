import "server-only";

import { getDb } from "@/db";
import { activityLog, type ActivityLogEntry } from "@/db/schema";

type Conn = Pick<Awaited<ReturnType<typeof getDb>>, "insert">;

export type ActivityInput = {
  /** Who did it; null for the system (e.g. a sign-in lockout). */
  actorId: string | null;
  action: string;
  targetType: ActivityLogEntry["targetType"];
  targetId: string;
  note?: string | null;
};

/** Writes one row to the platform activity log (admin actions, exports and security events). */
export async function recordActivity(entry: ActivityInput, conn?: Conn) {
  const db = conn ?? (await getDb());
  await db.insert(activityLog).values({ ...entry, note: entry.note?.slice(0, 500) || null });
}
