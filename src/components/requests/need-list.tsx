import Link from "next/link";
import { FoodIcon } from "@/components/donor/food-icon";
import { StageBadge } from "@/components/ngo/stage-badge";
import { CATEGORY_LABEL, UNIT_SHORT } from "@/lib/donations/meta";
import type { NeedProgress } from "@/lib/requests/meta";
import type { NeedListItem } from "@/lib/requests/service";
import { formatDateTime, formatNumber } from "@/lib/utils";

/** Requested → matched → delivered, in meals, as one bar. */
export function NeedProgressBar({ progress, className }: { progress: NeedProgress; className?: string }) {
  const pct = (n: number) => `${Math.min(100, Math.round((n / Math.max(1, progress.requested)) * 100))}%`;
  return (
    <div className={className}>
      <div
        role="img"
        aria-label={`${progress.delivered} of ${progress.requested} meals delivered, ${progress.matched} matched`}
        className="relative h-2 overflow-hidden rounded-full bg-cream-200"
      >
        <span className="absolute inset-y-0 left-0 rounded-full bg-brand-300" style={{ width: pct(progress.matched) }} />
        <span className="absolute inset-y-0 left-0 rounded-full bg-brand-600" style={{ width: pct(progress.delivered) }} />
      </div>
      <p className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-ink-500">
        <span>
          <span className="font-semibold text-brand-950">{formatNumber(progress.requested)}</span> requested
        </span>
        <span>{formatNumber(progress.matched)} matched</span>
        <span>{formatNumber(progress.delivered)} delivered</span>
        <span>{formatNumber(progress.remaining)} remaining</span>
      </p>
    </div>
  );
}

export function NeedList({ items }: { items: NeedListItem[] }) {
  return (
    <ul className="divide-y divide-cream-200">
      {items.map((n) => (
        <li key={n.id}>
          <Link href={`/ngo/requests/${n.id}`} className="group flex gap-4 px-5 py-4 hover:bg-cream-50 sm:px-6">
            <FoodIcon category={n.category ?? "other"} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="font-semibold text-brand-950 group-hover:text-brand-700">
                  {n.foodType || (n.category ? CATEGORY_LABEL[n.category] : "Any food")}
                </p>
                <StageBadge stage={n.stage} />
              </div>
              <p className="mt-0.5 text-sm text-ink-500">
                {n.quantity} {UNIT_SHORT[n.unit]} for {n.people} people · {n.area} · by {formatDateTime(n.neededBy)}
              </p>
              <NeedProgressBar progress={n.progress} className="mt-2.5 max-w-md" />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
