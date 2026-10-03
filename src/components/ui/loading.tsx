"use client";

import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" className={cn("size-5 animate-spin", className)}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Loading({ label = "Loading…", className }: { label?: string; className?: string }) {
  const { t } = useI18n();
  return (
    <div role="status" className={cn("flex items-center justify-center gap-3 py-12 text-sm text-ink-500", className)}>
      <Spinner className="text-brand-600" />
      {t(label)}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-field bg-ink-200/70", className)} />;
}
