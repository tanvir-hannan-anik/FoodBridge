import Link from "next/link";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="grain mt-auto overflow-hidden bg-brand-950 text-cream-100">
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-8 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4 lg:col-span-2">
            <Logo invert />
            <p className="max-w-sm text-sm leading-relaxed text-brand-200">
              We connect surplus food from restaurants, hotels, shops and homes with NGOs and volunteers, so good food
              feeds people instead of landfills.
            </p>
          </div>
          <FooterColumn
            title="Platform"
            links={[
              { href: "/#how-it-works", label: "How it works" },
              { href: "/register", label: "Donate food" },
              { href: "/login", label: "Log in" },
            ]}
          />
          <FooterColumn
            title="Get involved"
            links={[
              { href: "/register?role=ngo", label: "For NGOs" },
              { href: "/register?role=volunteer", label: "Volunteer" },
              { href: "/#impact", label: "Our impact" },
            ]}
          />
        </div>

        <p
          aria-hidden
          className="mt-14 font-display text-[18vw] leading-none font-semibold tracking-tighter text-brand-900 select-none sm:text-[9.5rem]"
        >
          FoodBridge
        </p>

        <div className="mt-6 flex flex-col justify-between gap-2 border-t border-white/10 pt-6 text-xs text-brand-300 sm:flex-row">
          <p>© {new Date().getFullYear()} FoodBridge · FoodWasteZero initiative</p>
          <p>Made with care to feed people, not landfills.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="text-xs font-semibold tracking-widest text-accent-300 uppercase">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-cream-100/80 transition-colors hover:text-accent-300">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
