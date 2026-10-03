import { CATEGORY_LABEL, CONDITION_LABEL, UNIT_LABEL } from "@/lib/donations/meta";
import { MATCH_RULES } from "@/lib/matching/meta";
import { safetyRulesText } from "@/lib/safety/meta";
import { DISPATCH_RULES } from "@/lib/volunteer/meta";

/*
 * Approved FoodWasteZero / FoodBridge knowledge for the assistant (the RAG corpus). Only this
 * text is used to answer platform questions. Rule numbers are read from the same constants the
 * app enforces, so the assistant can't drift from the real rules. Edit or add articles here.
 */

export type KnowledgeDoc = { id: string; title: string; audience: "all" | "donor" | "ngo" | "volunteer" | "admin"; body: string };

const list = (items: string[]) => items.map((i) => `- ${i}`).join("\n");

export const KNOWLEDGE: KnowledgeDoc[] = [
  {
    id: "about",
    title: "What FoodBridge does",
    audience: "all",
    body: `FoodBridge is the FoodWasteZero initiative's platform for all of Bangladesh (it started in Dhaka). Donors (restaurants, hotels, shops, households) post surplus food. Verified NGOs request it or get it matched to their food requests. Verified volunteers pick it up and deliver it. The FoodBridge team (admins) verifies partners and keeps food safe and moving. Recipients are only counted as meals or people served; no personal data about them is stored.`,
  },
  {
    id: "donate-how",
    title: "How to donate food",
    audience: "donor",
    body: `Go to Donate food and fill in four steps:
1. What: food type (e.g. "Chicken biryani"), category, quantity and unit, and condition.
2. When: prepared time, pickup-from time and best-before time.
3. Where: pickup address, an optional map pin, and a contact person and phone.
4. Optional: a photo (JPG/PNG/WebP up to 2 MB) and special instructions.
Categories: ${Object.values(CATEGORY_LABEL).join(", ")}. Units: ${Object.values(UNIT_LABEL).join(", ")}. Conditions: ${Object.values(CONDITION_LABEL).join("; ")}.
After posting, nearby NGOs can request it and the system matches it to NGO food requests. You accept one NGO's request, or the NGO accepts a system match. You can cancel until the food is picked up. The AI assistant can fill the form from a description; you always check and post it yourself.`,
  },
  {
    id: "safety",
    title: "Food safety and expiry rules",
    audience: "all",
    body: `${list(safetyRulesText())}
Food shows as Safe, Expiring soon or Expired. Expired food is removed from matching and the available-food list automatically and can't be allocated or picked up. The donor, NGO, volunteer and admins get one warning when food is close to expiry.`,
  },
  {
    id: "ngo-request",
    title: "How NGOs get food",
    audience: "ngo",
    body: `There are two ways. 1) Find food: browse available donations and send a request with quantity, people to feed and a preferred pickup time; the donor accepts one NGO. 2) Food requests: post what you need (food type or any food, quantity, people to serve, area, delivery address and map pin, needed-by time, notes). The system proposes the best donation; you accept or reject it. You can edit or cancel a food request until food has been accepted, and close it when you have enough. NGOs must be verified by FoodBridge before requesting food. Don't include names or personal details of the people you serve.`,
  },
  {
    id: "donor-answers-needs",
    title: "Answering NGO food requests as a donor",
    audience: "donor",
    body: `When a verified NGO near you posts a food request, you get an alert (in the app, and by SMS, WhatsApp or Messenger if you turned those on), so you don't have to keep checking the website. Open "NGO needs" (or the card on your dashboard) to see what each NGO needs, for how many people, where and by when. Tap "I can help" to send the NGO a short reply, e.g. "I'll have some food left soon. I can give this." Choose "Send and post the food" to go straight to the donation form, pre-filled from their request: your food is offered to that NGO first, the NGO confirms it, and then the nearest volunteer collects it from you. You can also donate money on the home page (online payments are coming soon).`,
  },
  {
    id: "matching",
    title: "How matching works",
    audience: "all",
    body: `Matching is rule-based, not AI. A donation is only proposed if it's available (not expired, cancelled, allocated or paused for a safety check), stays fresh for at least ${MATCH_RULES.minFreshMinutes} minutes, is ready before the needed-by time, is the right category, and is within ${MATCH_RULES.maxDistanceKm} km when both places are pinned. Candidates are ranked by earlier expiry (${MATCH_RULES.weights.expiry * 100}%), closer location (${MATCH_RULES.weights.distance * 100}%) and suitable quantity (${MATCH_RULES.weights.quantity * 100}%). Match status goes Pending → Matched → Accepted → Allocated. If a donation is bigger than a request needs, only the needed part is allocated and the rest stays available (partial allocation). NGOs and admins can accept, reject, or cancel an allocated match before pickup.`,
  },
  {
    id: "volunteer",
    title: "Volunteering and deliveries",
    audience: "volunteer",
    body: `Register as a volunteer; FoodBridge verifies you, then switch to Available. When food is allocated, the pickup is offered to the nearest available volunteer, one at a time. You have ${DISPATCH_RULES.offerMinutes} minutes to accept or decline; then it goes to the next volunteer. If nobody nearby accepts, it opens to all volunteers. Task steps: Assigned → Accepted → Picked up → In transit → Delivered → Completed. Confirm pickup and delivery with an optional note and photo. You can hand a task back before pickup if you can't make it. Use "Update my location" so nearby pickups come to you first. Donor and NGO phone numbers are shown after you accept.`,
  },
  {
    id: "tracking",
    title: "Tracking, maps and live location",
    audience: "all",
    body: `Every donation has a timeline: Created, Matched, Volunteer assigned, Picked up, In transit, Delivered, Completed (or Cancelled / Expired). Delivery pages show a map with the pickup, the delivery point and the route Volunteer → Donor → NGO, plus Google Maps navigation links. Live location is optional: each person chooses to share after allowing location in their browser; only that delivery's donor, NGO, volunteer and admins can see it, it stops when you leave the page, and it's deleted when the delivery ends. The Map page shows people and food around you; private homes are shown only approximately.`,
  },
  {
    id: "notifications",
    title: "Notifications",
    audience: "all",
    body: `You get in-app notifications for important updates only: donation created, match found, request accepted, volunteer assigned, pickup confirmed, delivery completed, and expiry warnings. The bell shows how many are unread. You can filter, mark each read or unread, or mark all as read; opening one takes you to the donation, request or task it's about. In your profile you can also choose Email, SMS, WhatsApp or Messenger for important updates once FoodBridge connects them.`,
  },
  {
    id: "accounts",
    title: "Accounts, verification and privacy",
    audience: "all",
    body: `Donors can start straight away. NGOs and volunteers are verified by the FoodBridge team first (usually within one working day). Contact details are shared only once someone is committed: NGOs see the donor's phone after a match, volunteers see donor and NGO phones after accepting a task. Admins can suspend or deactivate accounts. The AI assistant can't change your account, accept anything or make decisions; it only answers questions, fills forms for you to check, and suggests next steps.`,
  },
  {
    id: "admin",
    title: "Admin tasks",
    audience: "admin",
    body: `Admins verify NGOs and volunteers, manage users, correct or cancel donations, release volunteers, accept/reject/cancel matches, pause food for a safety check or withdraw it as unsafe, and review the Allocations ledger and activity log. Admin alerts arrive when allocated food is close to expiry without pickup, or when no volunteer accepted a pickup. The Reports page shows food donated, food distributed, meals served, completed deliveries and expired food, filtered by date, location, donor type and status, with CSV exports (contact details are never exported; every export is logged).`,
  },
  {
    id: "chat-apps",
    title: "Using FoodBridge on WhatsApp or Messenger",
    audience: "all",
    body: `Once FoodBridge switches chat apps on, link yours in Profile → Chat apps: you get a 6-digit code and send "LINK 123456" from WhatsApp or Messenger. Donors can then send DONATE with a description of the food, NGOs send NEED with what they need. FoodBridge replies with a summary and posts it only after you reply YES (NO cancels); the same food-safety rules as the website apply. STATUS shows your latest updates, HELP lists commands and STOP unlinks. Linked chats receive only key updates: match found, volunteer assigned, pickup confirmed, delivery completed and expiry warnings. The website remains where everything is kept.`,
  },
  {
    id: "dashboards",
    title: "Dashboards and reports",
    audience: "all",
    body: `Each dashboard shows only what you need: donors see active and completed donations and meals donated; NGOs see available food, active requests, food received and meals served; volunteers see active tasks, deliveries and meals delivered. The "over time" card can show the last 7 days, 30 days, 90 days or 12 months. NGOs also have a Report page with food received and meals served by month and category.`,
  },
];
