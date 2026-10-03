/*
 * Bangla dictionary, keyed by the exact English text passed to t(). One entry per line,
 * `"English": "বাংলা",`, so scripts/i18n-check.mjs can read it. Placeholders ({food}, {n}) must appear
 * in both sides. Split by area to keep files reviewable.
 */
import { ADMIN } from "./admin";
import { COMMON } from "./common";
import { DONOR } from "./donor";
import { NGO } from "./ngo";
import { NOTIFICATIONS } from "./notifications";
import { VOLUNTEER } from "./volunteer";

export const BN: Record<string, string> = {
  ...COMMON,
  ...DONOR,
  ...NGO,
  ...VOLUNTEER,
  ...ADMIN,
  ...NOTIFICATIONS,
};
