import * as z from "zod";

/*
 * Shapes the assistant returns. Drafts are only suggestions: they pre-fill a form that the user
 * checks and submits, and the normal form validation (including food-safety rules) still applies.
 * Enum values are spelled out here so this module stays safe for the browser bundle.
 */

const CATEGORY = z.enum(["cooked", "bakery", "packaged", "raw", "fruits_veg", "dairy", "other"]);
const UNIT = z.enum(["plates", "kg", "packets", "boxes", "litres", "pieces"]);
const CONDITION = z.enum(["fresh", "good", "consume_soon"]);

export const donationDraftSchema = z.object({
  foodType: z.string().max(120).nullable().describe("Short name of the food, e.g. 'Chicken biryani'"),
  category: CATEGORY.nullable(),
  quantity: z.number().positive().max(10_000).nullable(),
  unit: UNIT.nullable(),
  condition: CONDITION.nullable(),
  preparedMinutesAgo: z.number().int().min(0).max(60 * 24 * 90).nullable().describe("How long ago the food was prepared, in minutes"),
  bestBeforeInHours: z.number().min(0).max(24 * 90).nullable().describe("Hours from now until best-before"),
  pickupInMinutes: z.number().int().min(0).max(60 * 24).nullable().describe("Minutes from now until the food is ready for pickup"),
  pickupAddress: z.string().max(250).nullable(),
  instructions: z.string().max(500).nullable(),
  missing: z.array(z.string()).describe("Required details the user still needs to give, in plain words"),
});
export type DonationDraft = z.infer<typeof donationDraftSchema>;

export const needDraftSchema = z.object({
  category: CATEGORY.nullable().describe("null means any food is fine"),
  foodType: z.string().max(120).nullable(),
  quantity: z.number().positive().max(10_000).nullable(),
  unit: UNIT.nullable(),
  people: z.number().int().min(1).max(100_000).nullable(),
  area: z.string().max(80).nullable(),
  address: z.string().max(250).nullable(),
  neededInHours: z.number().min(0.5).max(24 * 14).nullable().describe("Hours from now until the food is needed"),
  notes: z.string().max(300).nullable(),
  missing: z.array(z.string()),
});
export type NeedDraft = z.infer<typeof needDraftSchema>;

export type Suggestion = { title: string; detail: string; href: string | null; priority: "high" | "normal" };
export type AssistantIntent = "question" | "donation_form" | "request_form" | "my_updates";

/** What the assistant API returns for one turn. */
export type AssistantReply = {
  reply: string;
  intent: AssistantIntent;
  donationDraft?: DonationDraft | null;
  needDraft?: NeedDraft | null;
  suggestions?: Suggestion[];
  sources?: string[];
  aiUsed: boolean;
};

/* ---------------------------------------------------- draft ⇄ URL (form prefill) */

export function encodeDraft(draft: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(draft));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Decodes and validates a ?draft= value; anything malformed is ignored. */
export function decodeDraft<S extends z.ZodType>(schema: S, value: string | string[] | undefined): z.infer<S> | null {
  if (typeof value !== "string" || value.length > 4000) return null;
  try {
    const bin = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
    const json = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
    const parsed = schema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
