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

/** Intl locale for the interface language: Bangla dates come out with Bangla month names and digits. */
const locale = (lang: "en" | "bn") => (lang === "bn" ? "bn-BD" : "en-GB");

export function formatDateTime(date: Date, lang: "en" | "bn" = "en") {
  const text = new Intl.DateTimeFormat(locale(lang), {
    timeZone: TIMEZONE,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  // bn-BD keeps Latin "AM"/"PM"; use the Bangla day periods instead.
  return lang === "bn" ? text.replace(/\bAM\b/, "পূর্বাহ্ণ").replace(/\bPM\b/, "অপরাহ্ণ") : text;
}

export function formatDate(date: Date, lang: "en" | "bn" = "en") {
  return new Intl.DateTimeFormat(locale(lang), { timeZone: TIMEZONE, day: "numeric", month: "short", year: "numeric" }).format(
    date,
  );
}

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const bnDigits = (text: string) => text.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);

/** "in 3 h", "25 min ago" style relative time ("৩ ঘণ্টা পরে", "২৫ মিনিট আগে" in Bangla). */
export function formatRelative(date: Date, now = new Date(), lang: "en" | "bn" = "en") {
  const diffMin = Math.round((date.getTime() - now.getTime()) / 60000);
  const abs = Math.abs(diffMin);
  if (lang === "bn") {
    if (abs < 1) return "এইমাত্র";
    const value =
      abs < 60 ? `${abs} মিনিট` : abs < 60 * 48 ? `${Math.round(abs / 60)} ঘণ্টা` : `${Math.round(abs / 1440)} দিন`;
    return bnDigits(diffMin > 0 ? `${value} পরে` : `${value} আগে`);
  }
  const value = abs < 60 ? `${abs} min` : abs < 60 * 48 ? `${Math.round(abs / 60)} h` : `${Math.round(abs / 1440)} days`;
  if (abs < 1) return "just now";
  return diffMin > 0 ? `in ${value}` : `${value} ago`;
}

export function formatNumber(n: number, lang: "en" | "bn" = "en") {
  return lang === "bn" ? bnDigits(new Intl.NumberFormat("en-IN").format(n)) : new Intl.NumberFormat("en-US").format(n);
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
