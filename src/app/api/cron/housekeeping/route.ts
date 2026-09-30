import { hasBearerSecret } from "@/lib/auth/bearer";
import { runHousekeeping } from "@/lib/housekeeping";

/**
 * Scheduled upkeep (expiry + matching). Call it every few minutes from a scheduler
 * (e.g. a Vercel cron job) with `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request) {
  if (!hasBearerSecret(request, process.env.CRON_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }
  await runHousekeeping({ force: true });
  return Response.json({ ok: true, ranAt: new Date().toISOString() });
}
