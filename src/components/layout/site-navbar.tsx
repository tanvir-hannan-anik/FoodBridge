import Link from "next/link";
import { SITE_COPY } from "@/components/home/copy";
import { ArrowIcon } from "@/components/home/icons";
import { LanguageToggle } from "@/components/home/language-toggle";
import { ROLE_HOME } from "@/lib/auth/roles";
import type { SessionPayload } from "@/lib/auth/token";
import type { Lang } from "@/lib/i18n";
import { Logo } from "./logo";
import { MenuDetails } from "./menu-details";

const PILL =
  "group inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-accent-400 px-5 text-sm font-semibold text-night-950 transition-all duration-300 hover:bg-accent-300";

/** Public site header (night theme, English/Bangla). Server-rendered; the mobile menu is a native <details>. */
export function SiteNavbar({ session, lang }: { session: SessionPayload | null; lang: Lang }) {
  const t = SITE_COPY[lang].nav;
  const links = [
    { href: "/#food-waste", label: t.problem },
    { href: "/#hunger", label: t.hunger },
    { href: "/#how-it-works", label: t.how },
    { href: "/#impact", label: t.impact },
    { href: "/#join", label: t.join },
  ];

  const cta = session ? (
    <Link href={ROLE_HOME[session.role]} className={PILL}>
      {t.dashboard} <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  ) : (
    <>
      <Link
        href="/login"
        className="inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold text-cream-50 hover:bg-white/10"
      >
        {t.login}
      </Link>
      <Link href="/register" className={PILL}>
        {t.donate} <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </>
  );

  return (
    <header lang={lang} className="sticky top-0 z-40 border-b border-white/5 bg-night-950/80 backdrop-blur-md">
      <nav aria-label="Main" className="mx-auto flex h-17 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo invert />
        <ul className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 xl:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="block rounded-full px-4 py-1.5 text-sm font-medium text-mist-300 transition-colors hover:bg-white/10 hover:text-cream-50"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-2 xl:flex">
          <LanguageToggle lang={lang} label={t.language} />
          {cta}
        </div>

        <div className="flex items-center gap-2 xl:hidden">
          <LanguageToggle lang={lang} label={t.language} />
          <MenuDetails className="group relative">
            <summary
              aria-label={t.openMenu}
              className="grid size-11 cursor-pointer place-items-center rounded-full border border-white/10 bg-white/5 text-cream-50"
            >
              <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
                <path className="group-open:hidden" d="M4 8h16M4 16h16" strokeLinecap="round" />
                <path className="hidden group-open:block" d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </summary>
            <div className="absolute right-0 mt-3 w-72 origin-top-right animate-pop rounded-3xl border border-white/10 bg-night-900 p-3 shadow-raised">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block rounded-2xl px-4 py-3 font-display text-lg font-medium text-cream-50 hover:bg-white/5"
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-2 grid gap-2 border-t border-white/10 pt-3 [&>a]:h-12 [&>a]:w-full">{cta}</div>
            </div>
          </MenuDetails>
        </div>
      </nav>
    </header>
  );
}
