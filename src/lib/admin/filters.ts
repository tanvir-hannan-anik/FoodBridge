import { dayBoundaryInAppTz } from "@/lib/utils";

/** The search/filter bar shared by every admin table: text search, status, location and a date range. */
export type AdminFilters = {
  q?: string;
  status?: string;
  location?: string;
  /** Inclusive start of the `from` day, in the app timezone. */
  from?: Date;
  /** Inclusive end of the `to` day, in the app timezone. */
  to?: Date;
  /** The raw yyyy-mm-dd values, to refill the form. */
  fromRaw?: string;
  toRaw?: string;
};

type Params = Record<string, string | string[] | undefined>;

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function parseAdminFilters(params: Params, statuses: readonly string[]): AdminFilters {
  const str = (key: string) => {
    const v = params[key];
    return typeof v === "string" ? v.trim().slice(0, 80) : "";
  };
  const status = str("status");
  const fromRaw = DAY.test(str("from")) ? str("from") : "";
  const toRaw = DAY.test(str("to")) ? str("to") : "";
  return {
    q: str("q") || undefined,
    status: statuses.includes(status) ? status : undefined,
    location: str("location") || undefined,
    from: fromRaw ? dayBoundaryInAppTz(fromRaw, "start") : undefined,
    to: toRaw ? dayBoundaryInAppTz(toRaw, "end") : undefined,
    fromRaw: fromRaw || undefined,
    toRaw: toRaw || undefined,
  };
}

export function hasFilters(f: AdminFilters) {
  return Boolean(f.q || f.status || f.location || f.from || f.to);
}
