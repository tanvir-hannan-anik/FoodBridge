import type { BadgeTone } from "@/components/ui/badge";
import type { ChatOrderSource, ChatOrderStatus } from "@/db/schema";

/**
 * Orders received over WhatsApp / Messenger. n8n writes them to Supabase; FoodBridge mirrors them
 * into `chat_orders`. A shop's food offer is assigned by a verified NGO to a volunteer, who picks
 * it up at the shop and brings it to that NGO: New → Assigned → Picked up → Delivered.
 * NGO requests that came in over chat are shown as records only.
 */
export const CHAT_ORDER_RULES = {
  /** Sync with Supabase at most this often per server process (pages and housekeeping both ask). */
  syncSeconds: 30,
  /** Latest rows read from each Supabase table per sync. */
  syncLimit: 300,
  /** Offers older than this get an "older message" warning: call the shop before assigning. */
  staleHours: 24,
} as const;

export const CHAT_STATUS_META: Record<ChatOrderStatus, { label: string; tone: BadgeTone }> = {
  NEW: { label: "New", tone: "warning" },
  ASSIGNED: { label: "Volunteer assigned", tone: "violet" },
  PICKED_UP: { label: "Picked up", tone: "info" },
  DELIVERED: { label: "Delivered", tone: "success" },
  CLOSED: { label: "Closed", tone: "neutral" },
};

/** Supabase `status` values that mean "still waiting" (n8n's defaults; empty counts as waiting too). */
export const OPEN_SOURCE_STATUS: Record<ChatOrderSource, string> = { donation: "available", request: "open" };

/** What we write back to Supabase for an offer, so the chat bot stops offering food that's taken. */
export const SOURCE_STATUS_FOR: Partial<Record<ChatOrderStatus, string>> = {
  NEW: "available",
  ASSIGNED: "assigned",
  PICKED_UP: "picked_up",
  DELIVERED: "delivered",
};

export const ACTIVE_CHAT_STATUSES: ChatOrderStatus[] = ["ASSIGNED", "PICKED_UP"];

export function isStale(receivedAt: Date, now = new Date()) {
  return now.getTime() - receivedAt.getTime() > CHAT_ORDER_RULES.staleHours * 3_600_000;
}
