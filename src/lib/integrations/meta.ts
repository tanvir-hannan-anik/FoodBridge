import type { ChatChannel, Role } from "@/db/schema";

/*
 * WhatsApp / Messenger through n8n (Segment 17). The website stays the source of truth: chat can
 * only start a donation or a food request (after the user confirms with YES) and read statuses.
 * Client-safe labels and rules live here; the logic is in service.ts.
 */

export const CHAT_CHANNEL_LABEL: Record<ChatChannel, string> = { whatsapp: "WhatsApp", messenger: "Messenger" };

/** One-time link codes expire after this many minutes. */
export const LINK_CODE_MINUTES = 15;
/** An unconfirmed chat draft is forgotten after this many hours. */
export const PENDING_HOURS = 6;

const COMMON = "STATUS – your latest updates\nHELP – this list\nSTOP – unlink this chat";

export const CHAT_HELP: Record<Role, string> = {
  donor: `FoodBridge commands:
DONATE <what you have> – in your own words, or like this:
DONATE food: chicken biryani; quantity: 20 plates; condition: fresh; prepared: 1h ago; best before: 4h; pickup: 30 min; address: House 12, Road 5, Dhanmondi
YES – post the donation I summarised · NO – cancel it
${COMMON}`,
  ngo: `FoodBridge commands:
NEED <what you need> – in your own words, or like this:
NEED food: rice meals; quantity: 40 plates; people: 40; area: Mirpur; needed in: 3h
YES – post the food request I summarised · NO – cancel it
${COMMON}`,
  volunteer: `FoodBridge sends you pickup updates here. Accept tasks in the app.\n${COMMON}`,
  admin: `FoodBridge sends you alerts here.\n${COMMON}`,
};

export const NOT_LINKED_REPLY = (channel: ChatChannel) =>
  `Hi! This ${CHAT_CHANNEL_LABEL[channel]} isn’t linked to a FoodBridge account yet. Open FoodBridge → Profile → Chat apps, get a code, then send “LINK 123456” here.`;
