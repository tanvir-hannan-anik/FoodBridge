import Link from "next/link";
import { FoodIcon } from "@/components/donor/food-icon";
import { SafetyBadge } from "@/components/safety-badge";
import { Badge } from "@/components/ui";
import { UNIT_SHORT } from "@/lib/donations/meta";
import type { AvailableDonation } from "@/lib/ngo/service";
import { getI18n } from "@/lib/i18n-server";

/** Card grid of donations open for requests. */
export async function AvailableList({ items }: { items: AvailableDonation[] }) {
  const { t, dateTime, number } = await getI18n();
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((d) => {
        return (
          <li key={d.id}>
            <Link
              href={`/ngo/donations/${d.id}`}
              className="group flex h-full flex-col rounded-card border border-cream-200 bg-white p-5 shadow-card hover:border-brand-500"
            >
              <div className="flex items-start gap-3">
                <FoodIcon category={d.category} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-brand-950 group-hover:text-brand-700">{d.foodType}</p>
                  <p className="mt-0.5 truncate text-sm text-ink-500">{d.donorName}</p>
                </div>
                {d.myRequest === "PENDING" && <Badge tone="warning">Requested</Badge>}
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-cream-50 p-3 text-sm">
                <div>
                  <dt className="text-xs text-ink-500">{t("Quantity")}</dt>
                  <dd className="font-semibold text-brand-950">
                    {number(d.quantity)} {t(UNIT_SHORT[d.unit])}
                    <span className="font-normal text-ink-500"> · {t("~{n} meals", { n: d.mealsEstimate })}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-500">{t("Expires")}</dt>
                  <dd className="mt-0.5">
                    <SafetyBadge expiresAt={d.expiresAt} />
                  </dd>
                </div>
              </dl>

              <p className="mt-3 flex items-start gap-2 text-sm text-ink-600">
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="mt-0.5 size-4 shrink-0 text-brand-600"
                >
                  <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
                  <circle cx="12" cy="9.5" r="2.5" />
                </svg>
                <span className="line-clamp-2">{d.pickupAddress}</span>
              </p>
              <p className="mt-auto pt-4 text-xs text-ink-500">{t("Ready from {time}", { time: dateTime(d.pickupAt) })}</p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
