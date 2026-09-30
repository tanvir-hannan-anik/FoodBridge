import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "brand" | "info" | "warning" | "danger" | "success" | "violet";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-ink-100 text-ink-700 ring-ink-200",
  brand: "bg-brand-50 text-brand-800 ring-brand-200",
  success: "bg-brand-600 text-white ring-brand-600",
  info: "bg-sky-50 text-sky-800 ring-sky-200",
  violet: "bg-violet-50 text-violet-800 ring-violet-200",
  warning: "bg-accent-50 text-accent-700 ring-accent-100",
  danger: "bg-red-50 text-red-700 ring-red-200",
};

export function Badge({ tone = "neutral", className, ...props }: ComponentProps<"span"> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}
