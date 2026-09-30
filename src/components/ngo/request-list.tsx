import Link from "next/link";
import { FoodIcon } from "@/components/donor/food-icon";
import { UNIT_SHORT } from "@/lib/donations/meta";
import type { NgoRequestItem } from "@/lib/ngo/service";
import { formatDateTime } from "@/lib/utils";
import { StageBadge } from "./stage-badge";

export function RequestList({ items }: { items: NgoRequestItem[] }) {
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
                {r.donorName} · {r.quantity} {UNIT_SHORT[r.unit]} for {r.people} people
              </p>
            </div>
            <p className="hidden shrink-0 text-right text-xs text-ink-500 sm:block">
              Pickup
              <span className="block font-medium text-ink-700">{formatDateTime(r.preferredAt)}</span>
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
