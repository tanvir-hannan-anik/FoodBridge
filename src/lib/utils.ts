import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge about our custom radius/shadow tokens so overrides resolve correctly.
const twMerge = extendTailwindMerge({
  extend: { theme: { radius: ["field", "card"], shadow: ["card", "raised"] } },
});

/** Joins class names, skipping falsy values; later Tailwind classes override conflicting earlier ones. */
export function cn(...classes: (string | false | null | undefined)[]) {
  return twMerge(classes.filter(Boolean).join(" "));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when every value is a well-formed record id (UUID). Guards ids that arrive from the client. */
export function isId(...values: unknown[]) {
  return values.every((v) => typeof v === "string" && UUID.test(v));
}

const TIMEZONE = process.env.APP_TIMEZONE ?? "Asia/Dhaka";

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TIMEZONE, day: "numeric", month: "short", year: "numeric" }).format(
    date,
  );
}

/** "in 3 h", "25 min ago" style relative time. */
export function formatRelative(date: Date, now = new Date()) {
  const diffMin = Math.round((date.getTime() - now.getTime()) / 60000);
  const abs = Math.abs(diffMin);
  const value = abs < 60 ? `${abs} min` : abs < 60 * 48 ? `${Math.round(abs / 60)} h` : `${Math.round(abs / 1440)} days`;
  if (abs < 1) return "just now";
  return diffMin > 0 ? `in ${value}` : `${value} ago`;
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

/** True when `date` is in the future but less than `minutes` away. */
export function expiresWithin(date: Date, minutes: number) {
  const diff = date.getTime() - Date.now();
  return diff > 0 && diff < minutes * 60_000;
}

/** "Good morning" / "Good afternoon" / "Good evening" in the app timezone. */
export function greeting(now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: TIMEZONE, hour: "numeric", hour12: false }).format(now));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

/** Offset of the app timezone from UTC at `date`, in ms (e.g. +6 h for Asia/Dhaka). */
function appTzOffsetMs(date: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    })
      .formatToParts(date)
      .map((p) => [p.type, Number(p.value)]),
  );
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Start or end of a yyyy-mm-dd day in the app timezone, for date-range filters. */
export function dayBoundaryInAppTz(day: string, edge: "start" | "end") {
  const [y, m, d] = day.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d) + (edge === "end" ? 86_400_000 - 1 : 0);
  return new Date(utc - appTzOffsetMs(new Date(utc)));
}
