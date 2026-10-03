import type { BadgeTone } from "@/components/ui/badge";
import type { FoodCategory, FoodCondition, SafetyFlag } from "@/db/schema";

/*
 * Food-safety rules in one place: simple, configurable, and aimed only at stopping unsafe food
 * from being distributed. The best-before time the donor enters is the single expiry used by
 * the whole platform (matching, allocation, sweeps); these rules check it is believable.
 */
export const SAFETY_RULES = {
  /** Food must stay safe at least this long when it's posted, so there's time to collect it. */
  minListingMinutes: 30,
  /** "Expiring soon" badge and warning notifications start this long before best-before. */
  expiringSoonMinutes: 60,
  /** The longest a best-before time may be after the food was prepared, by category. */
  maxHoursAfterPrepared: {
    cooked: 8,
    bakery: 48,
    dairy: 24,
    raw: 24,
    fruits_veg: 72,
    packaged: 24 * 90,
    other: 24,
  } satisfies Record<FoodCategory, number>,
  /** "Consume soon" food may not be listed as good for longer than this from now. */
  consumeSoonMaxHours: 4,
} as const;

export type SafetyStatus = "safe" | "expiring_soon" | "expired" | "flagged" | "disabled";

export const SAFETY_META: Record<SafetyStatus, { label: string; tone: BadgeTone; description: string }> = {
  safe: { label: "Safe", tone: "success", description: "Within its safe time window." },
  expiring_soon: { label: "Expiring soon", tone: "warning", description: "Less than an hour of safe time left." },
  expired: { label: "Expired", tone: "danger", description: "Past its best-before time. It can’t be matched or delivered." },
  flagged: { label: "Safety check", tone: "danger", description: "Paused by FoodBridge until the food-safety details are checked." },
  disabled: { label: "Withdrawn", tone: "neutral", description: "Withdrawn by FoodBridge for food-safety reasons." },
};

/** Safe / Expiring soon / Expired, or the admin hold if there is one. */
export function safetyStatus(d: { expiresAt: Date; safetyFlag?: SafetyFlag | null }, now = new Date()): SafetyStatus {
  if (d.safetyFlag === "DISABLED") return "disabled";
  if (d.safetyFlag === "FLAGGED") return "flagged";
  const left = d.expiresAt.getTime() - now.getTime();
  if (left <= 0) return "expired";
  return left <= SAFETY_RULES.expiringSoonMinutes * 60_000 ? "expiring_soon" : "safe";
}

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/** "2 h 15 min left", "40 min left", "expired 3 h ago" ("২ ঘণ্টা ১৫ মিনিট বাকি" in Bangla). */
export function remainingLabel(expiresAt: Date, now = new Date(), lang: "en" | "bn" = "en") {
  const minutes = Math.round((expiresAt.getTime() - now.getTime()) / 60_000);
  const abs = Math.abs(minutes);
  if (lang === "bn") {
    const text =
      abs < 60
        ? `${abs} মিনিট`
        : abs < 48 * 60
          ? `${Math.floor(abs / 60)} ঘণ্টা${abs % 60 ? ` ${abs % 60} মিনিট` : ""}`
          : `${Math.round(abs / 1440)} দিন`;
    const out = minutes > 0 ? `${text} বাকি` : `${text} আগে মেয়াদ শেষ`;
    return out.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
  }
  const text = abs < 60 ? `${abs} min` : abs < 48 * 60 ? `${Math.floor(abs / 60)} h${abs % 60 ? ` ${abs % 60} min` : ""}` : `${Math.round(abs / 1440)} days`;
  return minutes > 0 ? `${text} left` : `expired ${text} ago`;
}

/**
 * Checks a new donation against the safety window. Returns an error message for the best-before
 * field, or null when it's acceptable. Used by the donation form's validation.
 */
export function safetyWindowIssue(
  d: { category: FoodCategory; condition: FoodCondition; preparedAt: Date; expiresAt: Date },
  now = new Date(),
): string | null {
  const maxHours = SAFETY_RULES.maxHoursAfterPrepared[d.category];
  if (d.expiresAt.getTime() > d.preparedAt.getTime() + maxHours * 3_600_000) {
    return `For this food type, best-before can be at most ${maxHours >= 48 ? `${Math.round(maxHours / 24)} days` : `${maxHours} hours`} after it was prepared.`;
  }
  if (d.condition === "consume_soon" && d.expiresAt.getTime() > now.getTime() + SAFETY_RULES.consumeSoonMaxHours * 3_600_000) {
    return `“Consume soon” food can be listed for at most ${SAFETY_RULES.consumeSoonMaxHours} hours from now.`;
  }
  return null;
}

/** Plain-language rules, for the donation form and the AI assistant's knowledge base. */
export function safetyRulesText() {
  const hours = SAFETY_RULES.maxHoursAfterPrepared;
  return [
    `Food must stay safe for at least ${SAFETY_RULES.minListingMinutes} more minutes when you post it.`,
    `Best-before limits after preparation: cooked meals ${hours.cooked} h, dairy ${hours.dairy} h, raw ingredients ${hours.raw} h, bakery ${hours.bakery / 24} days, fruits & vegetables ${hours.fruits_veg / 24} days, packaged food ${hours.packaged / 24} days, other ${hours.other} h.`,
    `“Consume soon” food can be listed for at most ${SAFETY_RULES.consumeSoonMaxHours} hours.`,
    `Food is marked “Expiring soon” in its last ${SAFETY_RULES.expiringSoonMinutes} minutes and removed from matching once it expires.`,
    "FoodBridge can pause (flag) a donation for a safety check or withdraw it when its safety details are incomplete or doubtful.",
  ];
}
