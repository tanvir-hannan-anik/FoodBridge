import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui";
import { PERIODS, type Activity, type ActivityPoint, type Period } from "@/lib/analytics/meta";
import { getI18n } from "@/lib/i18n-server";
import type { I18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Metric = "meals" | "deliveries" | "posted";
type Total = { label: string; value: number; highlight?: boolean };

/**
 * Dashboard card: a period filter, a few totals and one simple bar chart. Server-rendered, no
 * chart library; the chart has a table fallback for screen readers.
 */
/** "12 Oct" / "Oct" bucket labels in the interface language. */
function bucketText(label: string, { t, number }: I18n) {
  return label
    .split(" ")
    .map((part) => (/^\d+$/.test(part) ? number(Number(part)) : t(part)))
    .join(" ");
}

export async function ActivityCard({
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
  const i18n = await getI18n();
  const { t, number } = i18n;
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-cream-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="font-display text-xl font-semibold text-brand-950">{t(title)}</h2>
          {description && <p className="text-sm text-ink-500">{typeof description === "string" ? t(description) : description}</p>}
        </div>
        <PeriodFilter path={path} current={activity.period} i18n={i18n} />
      </div>
      <div className="space-y-5 p-5 sm:p-6">
        <dl className={cn("grid gap-3", totals.length > 3 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3")}>
          {totals.map((total) => (
            <div key={total.label} className={cn("rounded-2xl px-3 py-2.5", total.highlight ? "bg-brand-50" : "bg-cream-50")}>
              <dt className="text-xs text-ink-500">{t(total.label)}</dt>
              <dd
                className={cn(
                  "font-display text-2xl font-semibold tabular-nums",
                  total.highlight ? "text-brand-700" : "text-brand-950",
                )}
              >
                {number(total.value)}
              </dd>
            </div>
          ))}
        </dl>
        <BarChart points={activity.points} metric={metric} label={t(metricLabel)} i18n={i18n} />
      </div>
    </Card>
  );
}

export function PeriodFilter({
  path,
  current,
  params = {},
  i18n,
}: {
  path: string;
  current: Period;
  params?: Record<string, string>;
  i18n: I18n;
}) {
  return (
    <nav aria-label={i18n.t("Period")} className="flex shrink-0 gap-1 rounded-full bg-cream-100 p-1">
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
          {i18n.t(PERIODS[p].label)}
        </Link>
      ))}
    </nav>
  );
}

/** Vertical bars, one per bucket; only some labels are printed so 30 bars stay readable. */
export function BarChart({
  points,
  metric,
  label,
  i18n,
}: {
  points: ActivityPoint[];
  metric: Metric;
  label: string;
  i18n: I18n;
}) {
  const { t, number } = i18n;
  const max = Math.max(1, ...points.map((p) => p[metric]));
  const every = points.length > 14 ? Math.ceil(points.length / 7) : 1;
  const empty = points.every((p) => p[metric] === 0);
  return (
    <figure>
      <figcaption className="mb-2 text-xs font-semibold tracking-widest text-ink-500 uppercase">{label}</figcaption>
      <div aria-hidden className="relative">
        {empty && <p className="absolute inset-0 grid place-items-center text-sm text-ink-500">{t("Nothing in this period yet")}</p>}
        <div className="flex h-32 items-end gap-[3px] border-b border-cream-200">
          {points.map((p) => (
            <div key={p.key} className="group relative flex h-full flex-1 items-end" title={`${bucketText(p.label, i18n)}: ${number(p[metric])}`}>
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
              {i % every === 0 ? bucketText(p.label, i18n) : ""}
            </span>
          ))}
        </div>
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {points.map((p) => (
            <tr key={p.key}>
              <th scope="row">{bucketText(p.label, i18n)}</th>
              <td>{number(p[metric])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
