import type { BadgeTone } from "@/components/ui/badge";
import type { DonationStatus, NgoType, RequestStatus } from "@/db/schema";

export const NGO_TYPE_LABEL: Record<NgoType, string> = {
  shelter: "Shelter / homeless support",
  orphanage: "Orphanage / children’s home",
  community_kitchen: "Community kitchen",
  elderly_home: "Elderly home",
  school: "School / madrasa",
  other: "Other charity",
};

/**
 * What the NGO sees for a request, whether it asked for a donation directly or the system
 * matched one to its food request. Combines the request's status with the donation's progress:
 * Pending (waiting for a donor / a match) → Matched (system found food; confirm it) →
 * Accepted (food is yours; a volunteer brings it) → Delivered → Completed, or Cancelled.
 */
export const STAGES = ["pending", "matched", "accepted", "delivered", "completed", "cancelled"] as const;
export type Stage = (typeof STAGES)[number];

export function requestStage(request: RequestStatus, donation: DonationStatus): Stage {
  if (request === "PENDING") return "pending";
  if (request === "MATCHED") return "matched";
  if (request !== "ACCEPTED") return "cancelled";
  switch (donation) {
    case "MATCHED":
    case "ASSIGNED":
    case "PICKED_UP":
    case "IN_TRANSIT":
      return "accepted";
    case "DELIVERED":
      return "delivered";
    case "COMPLETED":
      return "completed";
    default:
      return "cancelled";
  }
}

export const STAGE_META: Record<Stage, { label: string; tone: BadgeTone; description: string }> = {
  pending: { label: "Pending", tone: "warning", description: "Waiting for the donor to accept, or for suitable food to be found." },
  matched: { label: "Matched", tone: "info", description: "We found suitable food. Review it and confirm to accept." },
  accepted: { label: "Accepted", tone: "violet", description: "The food is yours. A volunteer picks it up and brings it to you." },
  delivered: { label: "Delivered", tone: "brand", description: "Food delivered. Mark it distributed once served." },
  completed: { label: "Completed", tone: "success", description: "Distributed to people in need. Thank you!" },
  cancelled: { label: "Cancelled", tone: "neutral", description: "This request is no longer active." },
};

export const REQUEST_CLOSED_REASON: Partial<Record<RequestStatus, string>> = {
  DECLINED: "This food went to another NGO, or it was cancelled.",
  SKIPPED: "You passed on this match.",
  CANCELLED: "This request was withdrawn.",
  EXPIRED: "The food expired before it could be matched.",
};

export const EXPIRY_FILTERS = [
  { value: "", label: "Any time" },
  { value: "2", label: "Expires within 2 hours" },
  { value: "6", label: "Expires within 6 hours" },
  { value: "24", label: "Expires within 24 hours" },
] as const;
