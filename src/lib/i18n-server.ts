import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { createI18n, isLang, LANG_COOKIE, type Lang } from "./i18n";

/** The visitor's chosen language; English until they pick Bangla. */
export async function getLang(): Promise<Lang> {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(value) ? value : "en";
}

/** Translator + formatters for server components, actions and route handlers (once per request). */
export const getI18n = cache(async () => createI18n(await getLang()));
