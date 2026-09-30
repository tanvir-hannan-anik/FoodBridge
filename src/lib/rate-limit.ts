import "server-only";

import { headers } from "next/headers";

/*
 * Sliding-window rate limits, kept in memory per process: enough to slow down password guessing,
 * sign-up spam and runaway clients on a single-server deployment. Behind several servers, move
 * this to a shared store (e.g. Redis).
 */

const store = globalThis as unknown as { __fbRateLimits?: Map<string, number[]>; __fbRateSweep?: number };
const hits: Map<string, number[]> = (store.__fbRateLimits ??= new Map());

/** Longest window any caller uses; older timestamps are never needed. */
const MAX_WINDOW_MS = 60 * 60_000;

function sweep(now: number) {
  if (now - (store.__fbRateSweep ?? 0) < 5 * 60_000) return;
  store.__fbRateSweep = now;
  for (const [key, times] of hits) if (!times.some((t) => now - t < MAX_WINDOW_MS)) hits.delete(key);
}

function recent(key: string, windowMs: number, now: number) {
  return (hits.get(key) ?? []).filter((t) => now - t < windowMs);
}

/** Counts one attempt for `key`. True when that makes more than `max` attempts in `windowMs`. */
export function rateLimited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  sweep(now);
  const times = recent(key, windowMs, now);
  times.push(now);
  hits.set(key, times);
  return times.length > max;
}

/** True when `key` has already used up `max` attempts in `windowMs`, without counting a new one. */
export function isRateLimited(key: string, max: number, windowMs: number) {
  return recent(key, windowMs, Date.now()).length >= max;
}

/** Forgets the attempts for `key` (e.g. after a successful login). */
export function clearRateLimit(key: string) {
  hits.delete(key);
}

/** Best-effort client address for rate limiting (first hop of x-forwarded-for, set by the proxy/host). */
export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}
