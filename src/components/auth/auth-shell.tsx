import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Warm, softly lit backdrop shared by the login and registration pages. */
export function AuthShell({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className="grain relative min-h-full overflow-hidden bg-cream-100">
      <div aria-hidden className="absolute -top-32 -right-32 size-[28rem] rounded-full bg-brand-100/80 blur-3xl" />
      <div aria-hidden className="absolute -bottom-40 -left-32 size-[26rem] rounded-full bg-accent-100 blur-3xl" />
      <div className={cn("relative mx-auto animate-rise px-4 py-12 sm:py-16", className)}>{children}</div>
    </div>
  );
}
