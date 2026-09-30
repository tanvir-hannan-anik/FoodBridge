import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users, type Role } from "@/db/schema";
import { ROLE_HOME } from "./roles";
import { readSession } from "./session";

/*
 * Data Access Layer: the authoritative auth check.
 * The proxy only does a fast cookie check; every page, action and route handler that
 * touches user data calls one of these, which re-reads the user from the database.
 */

export const getCurrentUser = cache(async () => {
  const session = await readSession();
  if (!session) return null;
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user || user.status === "suspended" || user.status === "deactivated") return null;
  // Signed out everywhere since this token was issued (password changed, account blocked).
  if ((session.v ?? 0) !== user.sessionVersion) return null;
  return user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  // A valid cookie whose user no longer exists would bounce between proxy and page; clear it.
  if (!user) redirect("/api/auth/signout");
  return user;
}

export async function requireRole(role: Role) {
  const user = await requireUser();
  if (user.role !== role) redirect(ROLE_HOME[user.role]);
  return user;
}
