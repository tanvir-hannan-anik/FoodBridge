import type { BadgeTone } from "@/components/ui/badge";
import type { DonationStatus, DonorType, FoodCategory, FoodCondition, Unit } from "@/db/schema";

export const CATEGORY_LABEL: Record<FoodCategory, string> = {
  cooked: "Cooked meals",
  bakery: "Bakery",
  packaged: "Packaged / dry food",
  raw: "Raw ingredients",
  fruits_veg: "Fruits & vegetables",
  dairy: "Dairy",
  other: "Other",
};

export const UNIT_LABEL: Record<Unit, string> = {
  plates: "Plates / servings",
  kg: "Kilograms (kg)",
  packets: "Packets",
  boxes: "Boxes",
  litres: "Litres",
  pieces: "Pieces",
};

export const UNIT_SHORT: Record<Unit, string> = {
  plates: "plates",
  kg: "kg",
  packets: "packets",
  boxes: "boxes",
  litres: "L",
  pieces: "pcs",
};

export const CONDITION_LABEL: Record<FoodCondition, string> = {
  fresh: "Fresh — just prepared / unopened",
  good: "Good — safe, stored properly",
  consume_soon: "Consume soon — best within a few hours",
};

export const DONOR_TYPE_LABEL: Record<DonorType, string> = {
  restaurant: "Restaurant",
  hotel: "Hotel",
  shop: "Shop / Supermarket",
  individual: "Individual / Household",
  other: "Other (event, office, caterer…)",
};

/** Rough meal equivalents per unit (≈ 400 g of food per meal). Used for "meals saved". */
export const MEALS_PER_UNIT: Record<Unit, number> = {
  plates: 1,
  kg: 2.5,
  packets: 1,
  boxes: 1,
  litres: 1,
  pieces: 0.5,
};

export function estimateMeals(quantity: number, unit: Unit) {
  return Math.max(1, Math.round(quantity * MEALS_PER_UNIT[unit]));
}

/** Units that can be split into halves (kg, litres); the rest are counted in whole items. */
const HALF_STEPS: Unit[] = ["kg", "litres"];

/** Rounds a quantity up to what can actually be handed over: whole items, or 0.5 kg / 0.5 L. */
export function roundQuantity(quantity: number, unit: Unit) {
  const step = HALF_STEPS.includes(unit) ? 0.5 : 1;
  return Math.ceil(quantity / step - 1e-9) * step;
}

/** The quantity that feeds about `meals` people. */
export function quantityForMeals(meals: number, unit: Unit) {
  return roundQuantity(meals / MEALS_PER_UNIT[unit], unit);
}

export const STATUS_META: Record<DonationStatus, { label: string; tone: BadgeTone; description: string }> = {
  PENDING: { label: "Pending", tone: "warning", description: "Open for NGO requests. Accept one to match it." },
  MATCHED: { label: "Matched", tone: "info", description: "Matched with an NGO. A volunteer will be assigned next." },
  ASSIGNED: { label: "Volunteer assigned", tone: "violet", description: "A volunteer is coming to pick it up." },
  PICKED_UP: { label: "Picked up", tone: "brand", description: "Food collected from the donor." },
  IN_TRANSIT: { label: "In transit", tone: "brand", description: "The volunteer is on the way to the NGO." },
  DELIVERED: { label: "Delivered", tone: "brand", description: "Delivered to the NGO." },
  COMPLETED: { label: "Completed", tone: "success", description: "Distributed to people in need. Thank you!" },
  CANCELLED: { label: "Cancelled", tone: "neutral", description: "This donation was cancelled." },
  EXPIRED: { label: "Expired", tone: "danger", description: "Not picked up before the best-before time." },
};

/** The happy path, in order, for the tracking timeline. */
export const FLOW: DonationStatus[] = ["PENDING", "MATCHED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "COMPLETED"];

export const ACTIVE_STATUSES: DonationStatus[] = ["PENDING", "MATCHED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"];

/** A volunteer has the food, or is on the way to get it: when live location sharing is offered. */
export const LIVE_STATUSES: DonationStatus[] = ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"];
export const CLOSED_STATUSES: DonationStatus[] = ["COMPLETED", "CANCELLED", "EXPIRED"];

/** Donors may cancel until food has been picked up. */
export const CANCELLABLE: DonationStatus[] = ["PENDING", "MATCHED", "ASSIGNED"];

export function toOptions<T extends string>(labels: Record<T, string>) {
  return (Object.entries(labels) as [T, string][]).map(([value, label]) => ({ value, label }));
}
