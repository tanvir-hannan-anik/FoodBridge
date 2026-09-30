import Link from "next/link";
import { ArrowIcon } from "@/components/home/icons";
import { ROLE_HOME } from "@/lib/auth/roles";
import type { SessionPayload } from "@/lib/auth/token";
import { Logo } from "./logo";
import { MenuDetails } from "./menu-details";

const LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#impact", label: "Impact" },
  { href: "/#join", label: "Get involved" },
];

const PILL =
  "group inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-brand-950 px-5 text-sm font-semibold text-cream-50 transition-all duration-300 hover:bg-brand-700";

/** Public site header. Server-rendered; the mobile menu is a native <details> with a tiny close-on-navigate helper. */
export function SiteNavbar({ session }: { session: SessionPayload | null }) {
  const cta = session ? (
    <Link href={ROLE_HOME[session.role]} className={PILL}>
      My dashboard <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  ) : (
    <>
      <Link
        href="/login"
        className="inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold text-brand-950 hover:bg-brand-900/5"
      >
        Log in
      </Link>
      <Link href="/register" className={PILL}>
        Donate food <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-brand-900/5 bg-cream-100/80 backdrop-blur-md">
      <nav aria-label="Main" className="mx-auto flex h-17 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <ul className="hidden items-center gap-1 rounded-full border border-brand-900/10 bg-white/60 p-1 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="block rounded-full px-4 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-brand-950 hover:text-cream-50"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-1 md:flex">{cta}</div>

        <MenuDetails className="group relative md:hidden">
          <summary
            aria-label="Open menu"
            className="grid size-11 cursor-pointer place-items-center rounded-full border border-brand-900/10 bg-white/70 text-brand-950"
          >
            <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
              <path className="group-open:hidden" d="M4 8h16M4 16h16" strokeLinecap="round" />
              <path className="hidden group-open:block" d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </summary>
          <div className="absolute right-0 mt-3 w-72 origin-top-right animate-pop rounded-3xl border border-cream-200 bg-cream-50 p-3 shadow-raised">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block rounded-2xl px-4 py-3 font-display text-lg font-medium text-brand-950 hover:bg-cream-100"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 grid gap-2 border-t border-cream-200 pt-3 [&>a]:h-12 [&>a]:w-full">{cta}</div>
          </div>
        </MenuDetails>
      </nav>
    </header>
  );
}
