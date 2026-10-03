import Link from "next/link";
import { FoodIcon } from "@/components/donor/food-icon";
import { StageBadge } from "@/components/ngo/stage-badge";
import { CATEGORY_LABEL, UNIT_SHORT } from "@/lib/donations/meta";
import type { NeedProgress } from "@/lib/requests/meta";
import type { NeedListItem } from "@/lib/requests/service";
import { getI18n } from "@/lib/i18n-server";

/** Requested → matched → delivered, in meals, as one bar. */
export async function NeedProgressBar({ progress, className }: { progress: NeedProgress; className?: string }) {
  const { t, number } = await getI18n();
  const pct = (n: number) => `${Math.min(100, Math.round((n / Math.max(1, progress.requested)) * 100))}%`;
  return (
    <div className={className}>
      <div
        role="img"
        aria-label={t("{delivered} of {requested} meals delivered, {matched} matched", {
          delivered: progress.delivered,
          requested: progress.requested,
          matched: progress.matched,
        })}
        className="relative h-2 overflow-hidden rounded-full bg-cream-200"
      >
        <span className="absolute inset-y-0 left-0 rounded-full bg-brand-300" style={{ width: pct(progress.matched) }} />
        <span className="absolute inset-y-0 left-0 rounded-full bg-brand-600" style={{ width: pct(progress.delivered) }} />
      </div>
      <p className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-ink-500">
        <span>
          <span className="font-semibold text-brand-950">{number(progress.requested)}</span> {t("requested")}
        </span>
        <span>{t("{n} matched", { n: progress.matched })}</span>
        <span>{t("{n} delivered", { n: progress.delivered })}</span>
        <span>{t("{n} remaining", { n: progress.remaining })}</span>
      </p>
    </div>
  );
}

export async function NeedList({ items }: { items: NeedListItem[] }) {
  const { t, dateTime, number } = await getI18n();
  return (
    <ul className="divide-y divide-cream-200">
      {items.map((n) => (
        <li key={n.id}>
          <Link href={`/ngo/requests/${n.id}`} className="group flex gap-4 px-5 py-4 hover:bg-cream-50 sm:px-6">
            <FoodIcon category={n.category ?? "other"} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="font-semibold text-brand-950 group-hover:text-brand-700">
                  {n.foodType || t(n.category ? CATEGORY_LABEL[n.category] : "Any food")}
                </p>
                <StageBadge stage={n.stage} />
              </div>
              <p className="mt-0.5 text-sm text-ink-500">
                {t("{qty} for {people}", {
                  qty: `${number(n.quantity)} ${t(UNIT_SHORT[n.unit])}`,
                  people: t("{n} people", { n: n.people }),
                })}{" "}
                · {n.area} · {t("by {time}", { time: dateTime(n.neededBy) })}
              </p>
              <NeedProgressBar progress={n.progress} className="mt-2.5 max-w-md" />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
