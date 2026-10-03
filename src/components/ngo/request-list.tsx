import Link from "next/link";
import { FoodIcon } from "@/components/donor/food-icon";
import { UNIT_SHORT } from "@/lib/donations/meta";
import type { NgoRequestItem } from "@/lib/ngo/service";
import { getI18n } from "@/lib/i18n-server";
import { StageBadge } from "./stage-badge";

export async function RequestList({ items }: { items: NgoRequestItem[] }) {
  const { t, dateTime, number } = await getI18n();
  return (
    <ul className="divide-y divide-cream-200">
      {items.map((r) => (
        <li key={r.id}>
          <Link href={`/ngo/donations/${r.donationId}`} className="group flex items-center gap-4 px-5 py-4 hover:bg-cream-50 sm:px-6">
            <FoodIcon category={r.category} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="font-semibold text-brand-950 group-hover:text-brand-700">{r.foodType}</p>
                <StageBadge stage={r.stage} />
              </div>
              <p className="mt-1 text-sm text-ink-500">
                {r.donorName} ·{" "}
                {t("{qty} for {people}", {
                  qty: `${number(r.quantity)} ${t(UNIT_SHORT[r.unit])}`,
                  people: t("{n} people", { n: r.people }),
                })}
              </p>
            </div>
            <p className="hidden shrink-0 text-right text-xs text-ink-500 sm:block">
              {t("Pickup")}
              <span className="block font-medium text-ink-700">{dateTime(r.preferredAt)}</span>
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
