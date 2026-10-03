/**
 * Interface language (English / Bangla) for the whole site. Client-safe.
 *
 * The visitor's choice lives in a cookie (read by `getI18n()` in i18n-server.ts on the server and by
 * `useI18n()` from components/i18n-provider.tsx on the client), so pages render in the right language
 * on the server with no flash.
 *
 * Text is keyed by its English wording: `t("Post a donation")`. The Bangla dictionary lives in
 * `src/lib/bn/`. Anything missing from it falls back to English, so a new string never breaks a page;
 * run `npm run i18n:check` to list untranslated keys.
 *
 * Placeholders: `t("{n} meals served", { n: 12 })`. Numbers are written with Bangla digits in Bangla.
 * Text stored in the database (notification messages) is translated by matching it against
 * placeholder keys: the stored "“Rice” was picked up." matches "“{food}” was picked up."
 */
import { formatDate, formatDateTime, formatNumber, formatRelative } from "@/lib/utils";
import { BN } from "./bn";

export const LANGS = ["en", "bn"] as const;
export type Lang = (typeof LANGS)[number];

export const LANG_COOKIE = "fb_lang";

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as readonly string[]).includes(value);
}

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Swaps Western digits for Bangla ones ("1,240" → "১,২৪০"). */
export function toBnDigits(text: string) {
  return text.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

/** Grouped number in the reader's language. Bangla uses South Asian grouping (12,34,567). */
export function formatCount(n: number, lang: Lang) {
  return formatNumber(n, lang);
}

/** Already Bangla (e.g. translated by a server component, then passed to a primitive that translates too). */
const BENGALI = /[\u0980-\u09FF]/;

export type Vars = Record<string, string | number | null | undefined>;

function fill(text: string, vars: Vars | undefined, lang: Lang) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (whole, key: string) => {
    if (!(key in vars)) return whole;
    const value = vars[key];
    if (value === undefined || value === null) return "";
    return typeof value === "number" ? formatNumber(value, lang) : value;
  });
}

type Template = { re: RegExp; names: string[]; bn: string };
let templates: Template[] | null = null;

/**
 * Keys with placeholders, compiled to regexes once, longest first so the most specific wins.
 * Keys whose fixed text has no English word ("{greeting}, {name}") would match almost anything,
 * so they're only used forwards (t(key, vars)), never to recognise a filled-in sentence.
 */
function compiledTemplates() {
  if (templates) return templates;
  templates = Object.entries(BN)
    .filter(([key]) => {
      if (!key.includes("{")) return false;
      const words = key.replace(/\{\w+\}/g, " ").match(/[A-Za-z]{2,}/g) ?? [];
      if (!words.length) return false;
      // "{qty} for {people}" would also match a food called "Rice for kids": keep such short,
      // open-ended keys forward-only.
      const openEnded = key.startsWith("{") && key.endsWith("}");
      return !openEnded || words.length >= 3;
    })
    .sort(([a], [b]) => b.length - a.length)
    .map(([key, bn]) => {
      const names: string[] = [];
      const pattern = key
        .split(/(\{\w+\})/)
        .map((part) => {
          const m = /^\{(\w+)\}$/.exec(part);
          if (m) {
            names.push(m[1]);
            return "([\\s\\S]+?)";
          }
          return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        })
        .join("");
      return { re: new RegExp(`^${pattern}$`), names, bn };
    });
  return templates;
}

/**
 * Bangla for an already-filled English sentence (e.g. a stored notification), or null. Captured
 * values are translated too when they are fixed wording ("The volunteer") or measurements with a
 * number in them ("8 hours", "1.2 km", "2 h left"); names and food stay exactly as written.
 */
function matchTemplate(text: string, depth = 0): string | null {
  for (const tpl of compiledTemplates()) {
    const m = tpl.re.exec(text);
    if (!m) continue;
    const vars: Vars = {};
    tpl.names.forEach((name, i) => {
      const value = m[i + 1];
      vars[name] = /^[\d.,]+$/.test(value)
        ? toBnDigits(value)
        : (BN[value] ?? (depth < 2 && /\d/.test(value) ? matchTemplate(value, depth + 1) : null) ?? value);
    });
    return fill(tpl.bn, vars, "bn");
  }
  return null;
}

/** Translate English UI text. Unknown text comes back unchanged, so translating twice is harmless. */
export function translate(lang: Lang, text: string, vars?: Vars): string {
  if (!text) return text;
  if (lang === "en") return fill(text, vars, lang);
  // Already Bangla, with no English words left: nothing to look up. (Stored English messages can
  // contain Bangla food names, so text with English words is still looked up.)
  if (BENGALI.test(text) && !/[A-Za-z]{2,}/.test(text)) return fill(text, vars, lang);
  const direct = BN[text];
  if (direct !== undefined) return fill(direct, vars, lang);
  if (!vars) {
    const matched = matchTemplate(text);
    if (matched !== null) return matched;
    // Stored messages may end with " Reason: <what someone typed>".
    const reason = /^([\s\S]+?[.!?])\s+Reason: ([\s\S]+)$/.exec(text);
    if (reason) return `${translate(lang, reason[1])} ${translate(lang, "Reason: {reason}", { reason: reason[2] })}`;
    // Stored messages can be several sentences ("… cancelled. Reason: …"): translate them one by one.
    const parts = text.split(/(?<=[.!?।])\s+(?=[A-Z“"])/);
    if (parts.length > 1) return parts.map((part) => BN[part] ?? matchTemplate(part) ?? part).join(" ");
  }
  return fill(text, vars, lang);
}

export type I18n = {
  lang: Lang;
  /** Translate English text; `{name}` placeholders are filled from `vars`. */
  t: (text: string, vars?: Vars) => string;
  /** "12 Oct, 3:40 pm" in the interface language. */
  dateTime: (date: Date) => string;
  /** "12 Oct 2026". */
  date: (date: Date) => string;
  /** "in 3 h" / "৩ ঘণ্টা পরে". */
  relative: (date: Date) => string;
  /** Grouped number, Bangla digits in Bangla. */
  number: (n: number) => string;
};

export function createI18n(lang: Lang): I18n {
  return {
    lang,
    t: (text, vars) => translate(lang, text, vars),
    dateTime: (d) => formatDateTime(d, lang),
    date: (d) => formatDate(d, lang),
    relative: (d) => formatRelative(d, new Date(), lang),
    number: (n) => formatNumber(n, lang),
  };
}
