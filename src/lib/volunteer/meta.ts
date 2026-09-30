import type { BadgeTone } from "@/components/ui/badge";
import type { DonationStatus, OfferStatus } from "@/db/schema";

/**
 * A delivery task is the donation from the moment it is allocated to an NGO. Its stage is
 * derived from the donation's status plus the volunteer's offer:
 * Assigned (offered to you: accept or decline) → Accepted → Picked up → In transit → Delivered
 * → Completed (the NGO served it). "Open" = no nearby volunteer took it, so anyone may accept.
 * Closed = cancelled, expired, or given to another volunteer.
 */
export const TASK_STAGES = ["assigned", "open", "accepted", "picked_up", "in_transit", "delivered", "completed", "closed"] as const;
export type TaskStage = (typeof TASK_STAGES)[number];

export function taskStage(status: DonationStatus, offeredToMe = false): TaskStage {
  switch (status) {
    case "MATCHED":
      return offeredToMe ? "assigned" : "open";
    case "ASSIGNED":
      return "accepted";
    case "PICKED_UP":
      return "picked_up";
    case "IN_TRANSIT":
      return "in_transit";
    case "DELIVERED":
      return "delivered";
    case "COMPLETED":
      return "completed";
    default:
      return "closed";
  }
}

export const TASK_META: Record<TaskStage, { label: string; tone: BadgeTone; next: string }> = {
  assigned: { label: "Assigned to you", tone: "warning", next: "You’re the nearest available volunteer. Accept or decline this pickup." },
  open: { label: "Open", tone: "warning", next: "No one nearby has taken this pickup yet. Accept it if you can help." },
  accepted: { label: "Accepted", tone: "violet", next: "Go to the donor and confirm pickup once you have the food." },
  picked_up: { label: "Picked up", tone: "info", next: "Start the delivery when you set off for the NGO." },
  in_transit: { label: "In transit", tone: "info", next: "Take the food to the NGO and confirm delivery." },
  delivered: { label: "Delivered", tone: "success", next: "Delivered. Thank you for volunteering!" },
  completed: { label: "Completed", tone: "success", next: "The NGO served this food. Thank you!" },
  closed: { label: "Closed", tone: "neutral", next: "This task was cancelled, the food expired, or it went to another volunteer." },
};

/** The task path shown to everyone (volunteer, donor, NGO). */
export const DELIVERY_FLOW = ["assigned", "accepted", "picked_up", "in_transit", "delivered", "completed"] as const satisfies readonly TaskStage[];

export const DELIVERY_STEP_LABEL: Record<(typeof DELIVERY_FLOW)[number], string> = {
  assigned: "Assigned",
  accepted: "Accepted",
  picked_up: "Picked up",
  in_transit: "In transit",
  delivered: "Delivered",
  completed: "Completed",
};

/** Donation statuses a volunteer is still working on. */
export const CURRENT_TASK_STATUSES: DonationStatus[] = ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"];
/** Donation statuses that count as a finished delivery. */
export const DELIVERED_STATUSES: DonationStatus[] = ["DELIVERED", "COMPLETED"];
/** Before pickup a volunteer may hand a task back; after it they must finish (or call the NGO). */
export const RELEASABLE: DonationStatus[] = ["ASSIGNED"];

/** Proof photo steps, used in the photo route's URL. */
export const PROOF_STEPS = { pickup: "PICKED_UP", delivery: "DELIVERED" } as const satisfies Record<string, DonationStatus>;
export type ProofStep = keyof typeof PROOF_STEPS;

/** Send a pickup reminder this long before the pickup time. */
export const REMINDER_MINUTES = 30;

/** Dispatch rules: one volunteer at a time, nearest first. */
export const DISPATCH_RULES = {
  /** An assigned volunteer has this long to accept before the task moves to the next one. */
  offerMinutes: 15,
  /** Don't offer tasks further than this from a volunteer's known position. */
  maxDistanceKm: 20,
  /** Volunteers already carrying this many tasks aren't offered more. */
  maxActiveTasks: 3,
} as const;

export const OFFER_STATUS_LABEL: Record<OfferStatus, string> = {
  OFFERED: "Waiting for reply",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  EXPIRED: "No reply in time",
  WITHDRAWN: "Withdrawn",
  RELEASED: "Handed back",
};
