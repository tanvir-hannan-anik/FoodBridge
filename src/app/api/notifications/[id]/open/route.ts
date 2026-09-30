import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/dal";
import { ROLE_HOME } from "@/lib/auth/roles";
import { notificationHref } from "@/lib/notifications/meta";

/** Opens a notification: marks it read and goes to the donation, request or task it's about. */
export async function GET(request: Request, ctx: RouteContext<"/api/notifications/[id]/open">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));
  const { id } = await ctx.params;
  const fallback = new URL(`${ROLE_HOME[user.role]}/notifications`, request.url);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.redirect(fallback);

  const db = await getDb();
  const [n] = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)))
    .returning({ donationId: notifications.donationId, needId: notifications.needId, type: notifications.type });
  const href = n ? notificationHref(user.role, n) : null;
  return NextResponse.redirect(href ? new URL(href, request.url) : fallback);
}
