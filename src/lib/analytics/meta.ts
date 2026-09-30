/*
 * Lightweight dashboard analytics (Segment 16): a period filter and time buckets. Client-safe.
 * Kept deliberately small: food rescued, meals delivered, successful deliveries and activity.
 */

export const PERIODS = {
  "7d": { label: "7 days", bucket: "day", count: 7 },
  "30d": { label: "30 days", bucket: "day", count: 30 },
  "90d": { label: "90 days", bucket: "week", count: 13 },
  "12m": { label: "12 months", bucket: "month", count: 12 },
} as const;
export type Period = keyof typeof PERIODS;
export type Bucket = (typeof PERIODS)[Period]["bucket"];

export const DEFAULT_PERIOD: Period = "30d";

export function parsePeriod(value: string | string[] | undefined): Period {
  return typeof value === "string" && value in PERIODS ? (value as Period) : DEFAULT_PERIOD;
}

export type ActivityPoint = { key: string; label: string; meals: number; deliveries: number; posted: number };
export type ActivityTotals = { posted: number; postedMeals: number; deliveries: number; mealsDelivered: number; expired: number };
export type Activity = { period: Period; points: ActivityPoint[]; totals: ActivityTotals };

const DAY = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Bucket keys (yyyy-mm-dd of each bucket's first day), oldest first, ending with the bucket holding `todayKey`. */
export function bucketKeys(period: Period, todayKey: string) {
  const { bucket, count } = PERIODS[period];
  const [y, m, d] = todayKey.split("-").map(Number);
  const today = Date.UTC(y, m - 1, d);
  const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
  if (bucket === "day") return Array.from({ length: count }, (_, i) => iso(today - (count - 1 - i) * DAY));
  if (bucket === "week") {
    const monday = today - ((new Date(today).getUTCDay() + 6) % 7) * DAY;
    return Array.from({ length: count }, (_, i) => iso(monday - (count - 1 - i) * 7 * DAY));
  }
  return Array.from({ length: count }, (_, i) => iso(Date.UTC(y, m - 1 - (count - 1 - i), 1)));
}

export function bucketLabel(bucket: Bucket, key: string) {
  const [, m, d] = key.split("-").map(Number);
  return bucket === "month" ? MONTHS[m - 1] : `${d} ${MONTHS[m - 1]}`;
}
