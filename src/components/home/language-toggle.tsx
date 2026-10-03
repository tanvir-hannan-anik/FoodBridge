import { setLanguage } from "@/app/actions/language";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const OPTIONS: { lang: Lang; label: string; name: string }[] = [
  { lang: "en", label: "EN", name: "English" },
  { lang: "bn", label: "বাং", name: "বাংলা" },
];

/** EN | বাং segmented switch. A plain form posting to a server action, so it also works without JavaScript. */
export function LanguageToggle({ lang, label, className }: { lang: Lang; label: string; className?: string }) {
  return (
    <form
      action={setLanguage}
      aria-label={label}
      className={cn("inline-flex rounded-full border border-white/10 bg-white/5 p-0.5", className)}
    >
      {OPTIONS.map((o) => {
        const active = o.lang === lang;
        return (
          <button
            key={o.lang}
            type="submit"
            name="lang"
            value={o.lang}
            lang={o.lang}
            aria-pressed={active}
            title={o.name}
            className={cn(
              "h-8 min-w-11 cursor-pointer rounded-full px-3 text-xs font-semibold transition-colors duration-300",
              active ? "bg-cream-50 text-night-950" : "text-mist-300 hover:text-cream-50",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </form>
  );
}
