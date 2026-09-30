import "server-only";

import { dispatchWaitingTasks, expireStaleOffers } from "@/lib/dispatch/service";
import { expireOverdueDonations } from "@/lib/donations/service";
import { flushOutbox } from "@/lib/notifications/service";
import { matchOpenNeeds } from "@/lib/requests/service";
import { sendExpiryWarnings } from "@/lib/safety/service";

const MIN_INTERVAL_MS = 60_000;
const state = globalThis as unknown as { __foodbridgeHousekeeping?: { last: number; running?: Promise<void> } };

/**
 * Platform-wide upkeep: expires donations past their best-before time (which closes their
 * requests, matches and volunteer tasks), matches available food to open NGO requests, moves
 * unanswered volunteer offers on, offers waiting pickup tasks to available volunteers, sends
 * one-time expiry warnings, and hands queued email/SMS/WhatsApp messages to their channels.
 *
 * Runs at most once a minute per server process, triggered by any signed-in page load
 * (see app/(app)/layout.tsx). In production, also call GET /api/cron/housekeeping on a
 * schedule so it happens even when nobody is using the app.
 */
export async function runHousekeeping({ force = false } = {}) {
  const s = (state.__foodbridgeHousekeeping ??= { last: 0 });
  if (s.running) return s.running;
  if (!force && Date.now() - s.last < MIN_INTERVAL_MS) return;
  s.last = Date.now();
  s.running = (async () => {
    try {
      await expireOverdueDonations();
      await matchOpenNeeds();
      await expireStaleOffers();
      await dispatchWaitingTasks();
      await sendExpiryWarnings();
      await flushOutbox();
    } finally {
      s.running = undefined;
    }
  })();
  return s.running;
}
