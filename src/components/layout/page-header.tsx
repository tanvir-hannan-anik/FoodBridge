import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 flex items-center gap-3 text-xs font-semibold tracking-widest text-brand-700 uppercase">
            <span className="h-px w-6 bg-accent-500" />
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl leading-tight font-semibold tracking-tight text-brand-950 sm:text-4xl">
          {title}
        </h1>
        {description && <p className="mt-2 max-w-xl text-ink-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}
