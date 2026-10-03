import Link from "next/link";
import { SITE_COPY } from "@/components/home/copy";
import { LanguageToggle } from "@/components/home/language-toggle";
import type { Lang } from "@/lib/i18n";
import { Logo } from "./logo";

export function Footer({ lang }: { lang: Lang }) {
  const t = SITE_COPY[lang].footer;
  return (
    <footer lang={lang} className="grain-night mt-auto overflow-hidden border-t border-white/5 bg-night-950 text-cream-100">
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-8 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-5 lg:col-span-2">
            <Logo invert />
            <p className="max-w-sm text-sm leading-relaxed text-mist-300">{t.about}</p>
            <LanguageToggle lang={lang} label={SITE_COPY[lang].nav.language} />
          </div>
          <FooterColumn
            title={t.platform}
            links={[
              { href: "/#how-it-works", label: t.how },
              { href: "/register", label: t.donate },
              { href: "/#donate-money", label: t.money },
              { href: "/login", label: t.login },
            ]}
          />
          <FooterColumn
            title={t.involved}
            links={[
              { href: "/register?role=ngo", label: t.forNgos },
              { href: "/register?role=volunteer", label: t.volunteer },
              { href: "/#impact", label: t.impact },
            ]}
          />
        </div>

        <p
          aria-hidden
          className="mt-14 bg-linear-to-b from-night-700 to-night-900 bg-clip-text font-display text-[18vw] leading-none font-semibold tracking-tighter text-transparent select-none sm:text-[9.5rem]"
        >
          {t.wordmark}
        </p>

        <div className="mt-6 flex flex-col justify-between gap-2 border-t border-white/10 pt-6 text-xs text-mist-400 sm:flex-row">
          <p>
            © {new Date().getFullYear()} FoodBridge · {t.initiative}
          </p>
          <p>{t.tagline}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-accent-300 uppercase">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-mist-200 transition-colors hover:text-accent-300">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
