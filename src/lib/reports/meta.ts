import { DONATION_STATUSES, DONOR_TYPES, type DonationStatus, type DonorType } from "@/db/schema";
import { dayBoundaryInAppTz } from "@/lib/utils";

/* Report filters and export datasets (Segment 18). Client-safe. */

export const EXPORT_DATASETS = {
  report: "Report summary",
  donations: "Donations",
  deliveries: "Deliveries",
  requests: "Food requests",
  users: "Users",
} as const;
export type ExportDataset = keyof typeof EXPORT_DATASETS;

export const EXPORT_ROLES = ["donor", "ngo", "volunteer"] as const;
export type ExportRole = (typeof EXPORT_ROLES)[number];

export type ReportQuery = {
  from?: Date;
  to?: Date;
  fromRaw?: string;
  toRaw?: string;
  location?: string;
  donorType?: DonorType;
  status?: DonationStatus;
  /** For the users export: which kind of account. */
  role?: ExportRole;
};

type Params = Record<string, string | string[] | undefined> | URLSearchParams;

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Reads report filters from page search params or a request URL; anything invalid is ignored. */
export function parseReportQuery(params: Params): ReportQuery {
  const get = (k: string) => {
    const v = params instanceof URLSearchParams ? params.get(k) : params[k];
    return typeof v === "string" ? v.trim().slice(0, 80) : "";
  };
  const fromRaw = DAY.test(get("from")) ? get("from") : undefined;
  const toRaw = DAY.test(get("to")) ? get("to") : undefined;
  const type = get("type");
  const status = get("status");
  const role = get("role");
  return {
    fromRaw,
    toRaw,
    from: fromRaw ? dayBoundaryInAppTz(fromRaw, "start") : undefined,
    to: toRaw ? dayBoundaryInAppTz(toRaw, "end") : undefined,
    location: get("location") || undefined,
    donorType: (DONOR_TYPES as readonly string[]).includes(type) ? (type as DonorType) : undefined,
    status: (DONATION_STATUSES as readonly string[]).includes(status) ? (status as DonationStatus) : undefined,
    role: (EXPORT_ROLES as readonly string[]).includes(role) ? (role as ExportRole) : undefined,
  };
}

/** The query string that reproduces these filters (for export links). */
export function reportQueryString(q: ReportQuery, extra: Record<string, string> = {}) {
  const params = new URLSearchParams(extra);
  if (q.fromRaw) params.set("from", q.fromRaw);
  if (q.toRaw) params.set("to", q.toRaw);
  if (q.location) params.set("location", q.location);
  if (q.donorType) params.set("type", q.donorType);
  if (q.status) params.set("status", q.status);
  if (q.role) params.set("role", q.role);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export const hasReportFilters = (q: ReportQuery) => Boolean(q.from || q.to || q.location || q.donorType || q.status || q.role);
