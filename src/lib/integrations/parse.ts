import type { DonationDraft, NeedDraft } from "@/lib/ai/schemas";

/*
 * Rule-based reading of chat messages, used when the AI is off (and as a check on required
 * fields either way). Understands short "key: value" lines, e.g.
 *   food: chicken biryani / quantity: 20 plates / category: cooked / condition: fresh
 *   prepared: 1h ago / best before: 4h / pickup: 30 min / address: House 12, Road 5, Dhanmondi
 */

type Unit = NonNullable<DonationDraft["unit"]>;
type Category = NonNullable<DonationDraft["category"]>;

const UNIT_WORDS: [RegExp, Unit][] = [
  [/^plates?$/, "plates"],
  [/^(kg|kgs|kilo|kilos|kilograms?)$/, "kg"],
  [/^(packets?|packs?)$/, "packets"],
  [/^box(es)?$/, "boxes"],
  [/^(l|litres?|liters?)$/, "litres"],
  [/^(pieces?|pcs|pc)$/, "pieces"],
];
const CATEGORY_WORDS: [RegExp, Category][] = [
  // Cooked dishes first, so "vegetable khichuri" is cooked food, not fresh vegetables.
  [/cook|meal|rice|biryani|curry|khichuri|khichdi|dal|polao|pulao|tehari|noodle|pasta|soup|chicken|beef|fish|egg/, "cooked"],
  [/bak|bread|cake/, "bakery"],
  [/pack|sealed|tin|canned/, "packaged"],
  [/fruit|veg/, "fruits_veg"],
  [/dairy|milk|yog/, "dairy"],
  [/raw|uncooked/, "raw"],
  [/other/, "other"],
];

function unitOf(word: string): Unit | null {
  return UNIT_WORDS.find(([re]) => re.test(word.toLowerCase()))?.[1] ?? null;
}

function categoryOf(text: string): Category | null {
  return CATEGORY_WORDS.find(([re]) => re.test(text.toLowerCase()))?.[1] ?? null;
}

/** "20 plates" → { quantity: 20, unit: "plates" } */
function quantityOf(text: string) {
  const m = text.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?/);
  if (!m) return { quantity: null, unit: null };
  return { quantity: Number(m[1]), unit: m[2] ? unitOf(m[2]) : null };
}

/** "4h", "90 min", "2 days", "now" → minutes; bare numbers use `defaultUnit`. */
function minutesOf(text: string, defaultUnit: "m" | "h"): number | null {
  if (/\bnow\b/i.test(text)) return 0;
  const m = text.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hours?|m|mins?|minutes?|d|days?)?\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  const u = (m[2] ?? defaultUnit).toLowerCase();
  return Math.round(u.startsWith("d") ? n * 1440 : u.startsWith("h") ? n * 60 : n);
}

/** Splits "key: value" lines (newlines or semicolons). */
function fields(text: string) {
  const out = new Map<string, string>();
  for (const part of text.split(/\n|;/)) {
    const m = part.match(/^\s*([a-zA-Z ]{2,20}?)\s*[:=]\s*(.+?)\s*$/);
    if (m) out.set(m[1].toLowerCase().replace(/\s+/g, " "), m[2]);
  }
  return out;
}

function pick(f: Map<string, string>, ...keys: string[]) {
  for (const k of keys) if (f.has(k)) return f.get(k)!;
  return null;
}

export function missingForDonation(d: DonationDraft) {
  const missing: string[] = [];
  if (!d.foodType) missing.push("food");
  if (!d.category) missing.push("category");
  if (!d.quantity || !d.unit) missing.push("quantity and unit");
  if (!d.condition) missing.push("condition (fresh, good or consume soon)");
  if (d.preparedMinutesAgo === null) missing.push("when it was prepared");
  if (d.bestBeforeInHours === null) missing.push("how long it stays good (best before)");
  return missing;
}

export function missingForNeed(d: NeedDraft) {
  const missing: string[] = [];
  if (!d.quantity || !d.unit) missing.push("quantity and unit");
  if (!d.people) missing.push("people to serve");
  if (!d.area) missing.push("area");
  if (d.neededInHours === null) missing.push("when you need it");
  return missing;
}

export function parseDonationText(text: string): DonationDraft {
  const f = fields(text);
  const qty = quantityOf(pick(f, "quantity", "qty", "amount") ?? "");
  const condition = pick(f, "condition", "state")?.toLowerCase() ?? "";
  const prepared = pick(f, "prepared", "cooked", "made");
  const best = pick(f, "best before", "bestbefore", "good for", "expires", "expiry");
  const pickup = pick(f, "pickup", "pickup time", "ready", "ready in");
  const draft: DonationDraft = {
    foodType: pick(f, "food", "item", "items")?.slice(0, 120) ?? null,
    category: categoryOf(pick(f, "category", "type") ?? pick(f, "food") ?? ""),
    quantity: qty.quantity,
    unit: (pick(f, "unit") && unitOf(pick(f, "unit")!)) || qty.unit,
    condition: /soon/.test(condition) ? "consume_soon" : /fresh/.test(condition) ? "fresh" : /good|ok/.test(condition) ? "good" : null,
    preparedMinutesAgo: prepared ? minutesOf(prepared, "m") : null,
    bestBeforeInHours: best ? (minutesOf(best, "h") ?? 0) / 60 || null : null,
    pickupInMinutes: pickup ? minutesOf(pickup, "m") : null,
    pickupAddress: pick(f, "address", "pickup address", "location")?.slice(0, 250) ?? null,
    instructions: pick(f, "note", "notes", "instructions")?.slice(0, 500) ?? null,
    missing: [],
  };
  draft.missing = missingForDonation(draft);
  return draft;
}

export function parseNeedText(text: string): NeedDraft {
  const f = fields(text);
  const qty = quantityOf(pick(f, "quantity", "qty", "amount") ?? "");
  const cat = pick(f, "category", "type");
  const needed = pick(f, "needed", "needed by", "needed in", "by", "when");
  const people = Number(pick(f, "people", "persons", "for")?.match(/\d+/)?.[0] ?? NaN);
  const draft: NeedDraft = {
    category: cat && !/any/i.test(cat) ? categoryOf(cat) : null,
    foodType: pick(f, "food", "item")?.slice(0, 120) ?? null,
    quantity: qty.quantity,
    unit: (pick(f, "unit") && unitOf(pick(f, "unit")!)) || qty.unit,
    people: Number.isFinite(people) && people > 0 ? people : null,
    area: pick(f, "area")?.slice(0, 80) ?? null,
    address: pick(f, "address")?.slice(0, 250) ?? null,
    neededInHours: needed ? (minutesOf(needed, "h") ?? 0) / 60 || null : null,
    notes: pick(f, "note", "notes")?.slice(0, 300) ?? null,
    missing: [],
  };
  draft.missing = missingForNeed(draft);
  return draft;
}
