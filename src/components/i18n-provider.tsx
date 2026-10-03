"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createI18n, type I18n, type Lang } from "@/lib/i18n";

const I18nContext = createContext<I18n>(createI18n("en"));

/** Gives client components the language chosen on the server (root layout). */
export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const value = useMemo(() => createI18n(lang), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Translator + formatters for client components: `const { t, dateTime } = useI18n()`. */
export function useI18n() {
  return useContext(I18nContext);
}
