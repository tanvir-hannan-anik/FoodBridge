import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ href = "/", className, invert }: { href?: string; className?: string; invert?: boolean }) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2.5", invert ? "text-cream-50" : "text-brand-950", className)}
    >
      <span
        aria-hidden
        className="grid size-9 place-items-center rounded-xl bg-brand-600 text-cream-50 shadow-glow transition-transform duration-500 group-hover:-rotate-6"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="size-5">
          <path d="M3 17c3-7 15-7 18 0" />
          <path d="M3 20h18M8 14.5V20M16 14.5V20M12 13v7" strokeWidth="1.8" />
          <path d="M12 3.5c-2 2-2 4.5 0 6.5 2-2 2-4.5 0-6.5Z" fill="var(--color-accent-400)" stroke="none" />
        </svg>
      </span>
      <span className="font-display text-xl font-semibold tracking-tight">
        Food<span className={invert ? "text-accent-300" : "text-brand-600"}>Bridge</span>
      </span>
    </Link>
  );
}
