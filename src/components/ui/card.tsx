"use client";

import type { ComponentProps, ReactNode } from "react";
import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-card border border-cream-200 bg-white shadow-card", className)} {...props} />;
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-cream-200 px-6 py-5", className)}>
      <div>
        <h2 className="font-display text-xl font-semibold text-brand-950">{t(title)}</h2>
        {description && <p className="mt-0.5 text-sm text-ink-500">{t(description)}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("p-6", className)} {...props} />;
}
