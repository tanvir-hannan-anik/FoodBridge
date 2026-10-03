"use client";

import { useI18n } from "@/components/i18n-provider";
import type { SafetyFlag } from "@/db/schema";
import { remainingLabel, SAFETY_META, safetyStatus } from "@/lib/safety/meta";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  safe: "bg-brand-50 text-brand-800 ring-brand-600/20",
  expiring_soon: "bg-accent-50 text-accent-700 ring-accent-500/30",
  expired: "bg-red-50 text-red-700 ring-red-600/20",
  flagged: "bg-red-50 text-red-700 ring-red-600/20",
  disabled: "bg-ink-100 text-ink-600 ring-ink-300",
};

/** Safe / Expiring soon / Expired (with time left), or the admin safety hold. */
export function SafetyBadge({
  expiresAt,
  safetyFlag,
  showTime = true,
  className,
}: {
  expiresAt: Date;
  safetyFlag?: SafetyFlag | null;
  showTime?: boolean;
  className?: string;
}) {
  const { t, lang } = useI18n();
  const status = safetyStatus({ expiresAt, safetyFlag });
  const timed = showTime && (status === "safe" || status === "expiring_soon");
  return (
    <span
      title={t(SAFETY_META[status].description)}
      className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", TONE[status], className)}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full bg-current", status === "expiring_soon" && "animate-pulse")} />
      {t(SAFETY_META[status].label)}
      {timed && <span className="font-normal">· {remainingLabel(expiresAt, new Date(), lang)}</span>}
    </span>
  );
}
