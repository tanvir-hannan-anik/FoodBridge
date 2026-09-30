import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Checks `Authorization: Bearer <secret>` for machine-to-machine endpoints (cron, n8n).
 * Refuses when the secret isn't configured or is too short. Compares digests so the check takes
 * the same time whatever the input.
 */
export function hasBearerSecret(request: Request, secret: string | undefined, minLength = 16) {
  if (!secret || secret.length < minLength) return false;
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(secret).digest();
  return timingSafeEqual(a, b);
}
