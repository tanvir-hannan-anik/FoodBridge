import type { NotificationType, NotifyChannel, Role } from "@/db/schema";

/**
 * The seven kinds of update users care about (plus "other" for everything else). Used for the
 * filter chips, the channel preferences and deciding what goes out over email/SMS/WhatsApp.
 */
export const NOTIFICATION_CATEGORIES = [
  "donation_created",
  "match_found",
  "request_accepted",
  "volunteer_assigned",
  "pickup_confirmed",
  "delivery_completed",
  "expiry_warning",
  "other",
] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const CATEGORY_LABEL: Record<NotificationCategory, string> = {
  donation_created: "Donation created",
  match_found: "Match found",
  request_accepted: "Request accepted",
  volunteer_assigned: "Volunteer assigned",
  pickup_confirmed: "Pickup confirmed",
  delivery_completed: "Delivery completed",
  expiry_warning: "Expiry & safety",
  other: "Other updates",
};

export const NOTIFICATION_CATEGORY: Record<NotificationType, NotificationCategory> = {
  donation_created: "donation_created",
  matched: "match_found",
  request_matched: "match_found",
  request_received: "match_found",
  partially_allocated: "match_found",
  request_accepted: "request_accepted",
  volunteer_assigned: "volunteer_assigned",
  task_assigned: "volunteer_assigned",
  task_accepted: "volunteer_assigned",
  picked_up: "pickup_confirmed",
  in_transit: "pickup_confirmed",
  delivered: "delivery_completed",
  completed: "delivery_completed",
  expiry_warning: "expiry_warning",
  expired: "expiry_warning",
  safety_review: "expiry_warning",
  pickup_reminder: "volunteer_assigned",
  admin_alert: "expiry_warning",
  cancelled: "other",
  request_submitted: "other",
  request_declined: "other",
  account_verified: "other",
  task_available: "other",
  task_declined: "other",
  match_cancelled: "other",
};

/** Categories important enough to also send over outside channels (email, SMS, WhatsApp, Messenger). */
export const EXTERNAL_CATEGORIES: NotificationCategory[] = NOTIFICATION_CATEGORIES.filter((c) => c !== "other");
/** Chat apps (WhatsApp, Messenger) get only the key status updates, so chats stay quiet. */
export const CHAT_CATEGORIES: NotificationCategory[] = ["match_found", "volunteer_assigned", "pickup_confirmed", "delivery_completed", "expiry_warning"];

export const CHANNEL_LABEL: Record<NotifyChannel, string> = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
  messenger: "Messenger",
};

/** Where a notification leads, for the user who received it. */
export function notificationHref(role: Role, n: { donationId: string | null; needId: string | null; type: NotificationType }) {
  if (n.needId && role === "ngo") return `/ngo/requests/${n.needId}`;
  if (!n.donationId) return n.type === "account_verified" ? `/${role}` : null;
  switch (role) {
    case "donor":
      return `/donor/donations/${n.donationId}`;
    case "ngo":
      return `/ngo/donations/${n.donationId}`;
    case "volunteer":
      return `/volunteer/tasks/${n.donationId}`;
    case "admin":
      return `/admin/donations/${n.donationId}`;
  }
}
