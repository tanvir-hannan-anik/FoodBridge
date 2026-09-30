import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui";
import { PERIODS, type Activity, type ActivityPoint, type Period } from "@/lib/analytics/meta";
import { cn, formatNumber } from "@/lib/utils";

type Metric = "meals" | "deliveries" | "posted";
type Total = { label: string; value: number; highlight?: boolean };

/**
 * Dashboard card: a period filter, a few totals and one simple bar chart. Server-rendered, no
 * chart library; the chart has a table fallback for screen readers.
 */
export function ActivityCard({
  title,
  description,
  activity,
  metric,
  metricLabel,
  totals,
  path,
}: {
  title: string;
  description?: ReactNode;
  activity: Activity;
  metric: Metric;
  metricLabel: string;
  totals: Total[];
  /** The dashboard's own path; the period filter links back to it. */
  path: string;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-cream-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="font-display text-xl font-semibold text-brand-950">{title}</h2>
          {description && <p className="text-sm text-ink-500">{description}</p>}
        </div>
        <PeriodFilter path={path} current={activity.period} />
      </div>
      <div className="space-y-5 p-5 sm:p-6">
        <dl className={cn("grid gap-3", totals.length > 3 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3")}>
          {totals.map((t) => (
            <div key={t.label} className={cn("rounded-2xl px-3 py-2.5", t.highlight ? "bg-brand-50" : "bg-cream-50")}>
              <dt className="text-xs text-ink-500">{t.label}</dt>
              <dd className={cn("font-display text-2xl font-semibold tabular-nums", t.highlight ? "text-brand-700" : "text-brand-950")}>
                {formatNumber(t.value)}
              </dd>
            </div>
          ))}
        </dl>
        <BarChart points={activity.points} metric={metric} label={metricLabel} />
      </div>
    </Card>
  );
}

export function PeriodFilter({ path, current, params = {} }: { path: string; current: Period; params?: Record<string, string> }) {
  return (
    <nav aria-label="Period" className="flex shrink-0 gap-1 rounded-full bg-cream-100 p-1">
      {(Object.keys(PERIODS) as Period[]).map((p) => (
        <Link
          key={p}
          href={`${path}?${new URLSearchParams({ ...params, period: p })}`}
          scroll={false}
          aria-current={p === current ? "true" : undefined}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            p === current ? "bg-white text-brand-950 shadow-card" : "text-ink-600 hover:text-brand-900",
          )}
        >
          {PERIODS[p].label}
        </Link>
      ))}
    </nav>
  );
}

/** Vertical bars, one per bucket; only some labels are printed so 30 bars stay readable. */
export function BarChart({ points, metric, label }: { points: ActivityPoint[]; metric: Metric; label: string }) {
  const max = Math.max(1, ...points.map((p) => p[metric]));
  const every = points.length > 14 ? Math.ceil(points.length / 7) : 1;
  const empty = points.every((p) => p[metric] === 0);
  return (
    <figure>
      <figcaption className="mb-2 text-xs font-semibold tracking-widest text-ink-500 uppercase">{label}</figcaption>
      <div aria-hidden className="relative">
        {empty && <p className="absolute inset-0 grid place-items-center text-sm text-ink-500">Nothing in this period yet</p>}
        <div className="flex h-32 items-end gap-[3px] border-b border-cream-200">
          {points.map((p) => (
            <div key={p.key} className="group relative flex h-full flex-1 items-end" title={`${p.label}: ${formatNumber(p[metric])}`}>
              <div
                className={cn("w-full rounded-t-[3px] bg-brand-500 group-hover:bg-brand-700", p[metric] === 0 && "bg-cream-200")}
                style={{ height: `${Math.max(p[metric] ? 4 : 1.5, (p[metric] / max) * 100)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-[3px]">
          {points.map((p, i) => (
            <span key={p.key} className="flex-1 truncate text-center text-[10px] text-ink-500">
              {i % every === 0 ? p.label : ""}
            </span>
          ))}
        </div>
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {points.map((p) => (
            <tr key={p.key}>
              <th scope="row">{p.label}</th>
              <td>{p[metric]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
