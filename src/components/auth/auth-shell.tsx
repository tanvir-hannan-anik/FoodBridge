import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Night backdrop with a warm lamp glow, shared by the login and registration pages. Cards stay cream paper on top. */
export function AuthShell({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className="grain-night relative min-h-full overflow-hidden bg-linear-to-b from-night-900 to-night-950">
      <div
        aria-hidden
        className="absolute -top-40 -right-32 size-[30rem] rounded-full bg-[radial-gradient(closest-side,rgb(246_177_58/0.2),transparent)]"
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -left-32 size-[28rem] rounded-full bg-[radial-gradient(closest-side,rgb(26_125_79/0.25),transparent)]"
      />
      <div className={cn("relative mx-auto animate-rise px-4 py-12 sm:py-16", className)}>{children}</div>
    </div>
  );
}
