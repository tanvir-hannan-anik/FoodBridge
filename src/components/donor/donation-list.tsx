import Link from "next/link";
import { Badge } from "@/components/ui";
import type { DonationListItem } from "@/lib/donations/service";
import { ACTIVE_STATUSES, CATEGORY_LABEL, UNIT_SHORT } from "@/lib/donations/meta";
import { formatDateTime } from "@/lib/utils";
import { SafetyBadge } from "@/components/safety-badge";
import { FoodIcon } from "./food-icon";
import { StatusBadge } from "./status-badge";

export function DonationList({ items, compact }: { items: DonationListItem[]; compact?: boolean }) {
  return (
    <ul className="divide-y divide-cream-200">
      {items.map((d) => {
        const active = ACTIVE_STATUSES.includes(d.status) && d.status !== "DELIVERED";
        return (
          <li key={d.id}>
            <Link
              href={`/donor/donations/${d.id}`}
              className="group flex items-center gap-4 px-5 py-4 hover:bg-cream-50 sm:px-6"
            >
              <FoodIcon category={d.category} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="font-semibold text-brand-950 group-hover:text-brand-700">{d.foodType}</p>
                  <StatusBadge status={d.status} />
                  {d.status === "PENDING" && d.pendingRequests > 0 && (
                    <Badge tone="warning">
                      {d.pendingRequests} {d.pendingRequests === 1 ? "request" : "requests"}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-ink-500">
                  <span>
                    {d.quantity} {UNIT_SHORT[d.unit]}
                  </span>
                  <Dot />
                  <span>~{d.mealsEstimate} meals</span>
                  {!compact && (
                    <span className="hidden items-center gap-x-2 sm:flex">
                      <Dot />
                      {CATEGORY_LABEL[d.category]}
                    </span>
                  )}
                </p>
              </div>

              <div className="shrink-0 text-right">
                {active ? (
                  <SafetyBadge expiresAt={d.expiresAt} safetyFlag={d.safetyFlag} />
                ) : (
                  <span className="text-xs text-ink-500">{formatDateTime(d.createdAt)}</span>
                )}
              </div>
              <svg
                aria-hidden
                viewBox="0 0 20 20"
                fill="currentColor"
                className="hidden size-4 shrink-0 text-ink-300 group-hover:text-brand-700 sm:block"
              >
                <path d="M7.2 14.8a.75.75 0 0 1 0-1.06L10.94 10 7.2 6.26a.75.75 0 1 1 1.06-1.06l4.27 4.27a.75.75 0 0 1 0 1.06L8.26 14.8a.75.75 0 0 1-1.06 0Z" />
              </svg>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Dot() {
  return <span aria-hidden className="size-1 rounded-full bg-ink-300" />;
}
