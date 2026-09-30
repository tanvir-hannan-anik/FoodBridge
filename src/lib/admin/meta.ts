import type { BadgeTone } from "@/components/ui/badge";
import type { RequestStatus, Role, UserStatus } from "@/db/schema";

export const USER_STATUS_META: Record<UserStatus, { label: string; tone: BadgeTone }> = {
  active: { label: "Active", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
  suspended: { label: "Suspended", tone: "danger" },
  deactivated: { label: "Deactivated", tone: "neutral" },
};

/** The raw status of one NGO ↔ donation request, as admins see it. */
export const REQUEST_STATUS_META: Record<RequestStatus, { label: string; tone: BadgeTone }> = {
  PENDING: { label: "Waiting for donor", tone: "warning" },
  MATCHED: { label: "Matched, awaiting NGO", tone: "info" },
  ACCEPTED: { label: "Accepted", tone: "success" },
  DECLINED: { label: "Declined", tone: "neutral" },
  SKIPPED: { label: "Skipped by NGO", tone: "neutral" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
  EXPIRED: { label: "Expired", tone: "danger" },
};

/** URL segment ↔ role for the user management views. */
export const ROLE_VIEWS = [
  { value: "donor", label: "Donors" },
  { value: "ngo", label: "NGOs" },
  { value: "volunteer", label: "Volunteers" },
] as const satisfies readonly { value: Exclude<Role, "admin">; label: string }[];

export const ADMIN_ACTION_LABEL: Record<string, string> = {
  approve: "Approved account",
  suspend: "Suspended account",
  deactivate: "Deactivated account",
  reactivate: "Reactivated account",
  edit: "Edited details",
  cancel: "Cancelled",
  release_volunteer: "Released volunteer",
  accept_match: "Accepted match for NGO",
  reject_match: "Rejected match",
  cancel_match: "Cancelled allocated match",
  safety_flag: "Paused for a safety check",
  safety_clear: "Cleared the safety check",
  safety_disable: "Withdrew food as unsafe",
  data_export: "Exported data",
  offer_volunteer: "Offered the pickup to a volunteer",
  confirm_delivery: "Confirmed delivery on a volunteer’s behalf",
  complete: "Recorded meals served for the NGO",
  password_change: "Changed password",
  login_locked: "Sign-in paused after failed attempts",
};

/** Activity log filter: what kind of record an entry is about. */
export const ACTIVITY_TARGETS = [
  { value: "user", label: "Accounts" },
  { value: "donation", label: "Donations" },
  { value: "request", label: "Requests & matches" },
  { value: "need", label: "Food requests" },
] as const;

/** Entries that are about sign-in and account security rather than an admin decision. */
export const SECURITY_ACTIONS = ["password_change", "login_locked"];

/**
 * When something on the admin "Needs attention" list counts as stuck. Plain thresholds, no
 * configuration screen: change them here.
 */
export const MONITOR_RULES = {
  /** Allocated food with no volunteer for this long. */
  waitingVolunteerMinutes: 30,
  /** Accepted by a volunteer but still not picked up this long after the pickup time. */
  latePickupMinutes: 60,
  /** Picked up or on the way with no update for this long. */
  stalledDeliveryHours: 3,
  /** Delivered, but the NGO hasn't recorded meals served after this long. */
  unconfirmedHours: 24,
  /** Open NGO food requests needed within this many hours with nothing matched. */
  urgentNeedHours: 6,
  /** How far back "recently expired" looks. */
  expiredLookbackHours: 24,
  /** Items shown per group on the dashboard. */
  perGroup: 5,
} as const;
