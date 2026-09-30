"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function useActive(href: string, exact?: boolean) {
  const pathname = usePathname();
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** Pill link for the desktop portal navigation. */
export function NavLink({ href, exact, children }: { href: string; exact?: boolean; children: ReactNode }) {
  const active = useActive(href, exact);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full px-4 py-1.5 text-sm font-medium",
        active ? "bg-brand-950 text-cream-50" : "text-ink-600 hover:bg-cream-100 hover:text-brand-950",
      )}
    >
      {children}
    </Link>
  );
}

/** Icon + label link for the mobile bottom tab bar. */
export function TabLink({
  href,
  exact,
  label,
  children,
}: {
  href: string;
  exact?: boolean;
  label: string;
  children: ReactNode;
}) {
  const active = useActive(href, exact);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-col items-center gap-1 pt-2.5 pb-2 text-[11px] font-semibold",
        active ? "text-brand-700" : "text-ink-500",
      )}
    >
      {children}
      {label}
    </Link>
  );
}
