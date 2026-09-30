import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "info" | "success" | "warning" | "error";

const TONES: Record<Tone, { box: string; icon: string; path: string }> = {
  info: {
    box: "border-sky-200 bg-sky-50 text-sky-900",
    icon: "text-sky-600",
    path: "M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9.25 9.5a.75.75 0 0 1 1.5 0v4a.75.75 0 0 1-1.5 0v-4Z",
  },
  success: {
    box: "border-brand-200 bg-brand-50 text-brand-900",
    icon: "text-brand-600",
    path: "M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.86-9.8a.75.75 0 0 0-1.22-.88l-3.24 4.5-1.6-1.6a.75.75 0 1 0-1.06 1.06l2.22 2.22a.75.75 0 0 0 1.14-.09l3.76-5.2Z",
  },
  warning: {
    box: "border-accent-100 bg-accent-50 text-accent-700",
    icon: "text-accent-600",
    path: "M8.49 2.87a1.75 1.75 0 0 1 3.02 0l6.28 10.88A1.75 1.75 0 0 1 16.28 16.4H3.72a1.75 1.75 0 0 1-1.51-2.63L8.49 2.87ZM10 6.5a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0v-3.5A.75.75 0 0 0 10 6.5Zm0 7.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z",
  },
  error: {
    box: "border-red-200 bg-red-50 text-red-800",
    icon: "text-red-600",
    path: "M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z",
  },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const t = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-field border px-4 py-3 text-sm", t.box, className)}
    >
      <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className={cn("mt-0.5 size-5 shrink-0", t.icon)}>
        <path fillRule="evenodd" clipRule="evenodd" d={t.path} />
      </svg>
      <div className="space-y-0.5">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
