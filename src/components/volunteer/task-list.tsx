import Link from "next/link";
import { toggleAvailability } from "@/app/actions/volunteer";
import { FoodIcon } from "@/components/donor/food-icon";
import { Badge, SubmitButton } from "@/components/ui";
import { UNIT_SHORT } from "@/lib/donations/meta";
import { formatDistance } from "@/lib/geo";
import { cn, formatDateTime, formatRelative } from "@/lib/utils";
import { TASK_META, taskStage, type TaskStage } from "@/lib/volunteer/meta";
import type { TaskListItem } from "@/lib/volunteer/service";

export function TaskBadge({ stage }: { stage: TaskStage }) {
  const meta = TASK_META[stage];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

const PIN = "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z";
const HOME = "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z";

function Leg({ icon, label, place, detail }: { icon: string; label: string; place: string; detail?: string | null }) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        className="mt-0.5 size-4 shrink-0 text-ink-500"
      >
        <path d={icon} />
      </svg>
      <p className="min-w-0 text-sm">
        <span className="sr-only">{label}: </span>
        <span className="block truncate font-medium text-ink-800">{place}</span>
        {detail && <span className="block truncate text-xs text-ink-500">{detail}</span>}
      </p>
    </div>
  );
}

/** Tap-friendly task cards: food, pickup → drop-off with distances, pickup time and status. */
export function TaskList({ items }: { items: TaskListItem[] }) {
  return (
    <ul className="space-y-3">
      {items.map((t) => {
        const stage = taskStage(t.status, t.offerStatus === "OFFERED");
        const upcoming = stage === "assigned" || stage === "open" || stage === "accepted";
        const toPickup = formatDistance(t.toPickupKm);
        const leg = formatDistance(t.deliveryKm);
        return (
          <li key={t.id}>
            <Link
              href={`/volunteer/tasks/${t.id}`}
              className="group block rounded-card border border-cream-200 bg-white p-4 shadow-card transition-colors hover:border-brand-500 sm:p-5"
            >
              <div className="flex items-start gap-3">
                <FoodIcon category={t.category} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-semibold text-brand-950 group-hover:text-brand-700">{t.foodType}</p>
                    <TaskBadge stage={stage} />
                  </div>
                  <p className="text-sm text-ink-500">
                    {t.quantity} {UNIT_SHORT[t.unit]} · ~{t.mealsEstimate} meals
                  </p>
                </div>
              </div>
              <div className="mt-3 grid gap-2 border-t border-cream-200 pt-3 sm:grid-cols-2">
                <Leg
                  icon={PIN}
                  label="Pick up from"
                  place={t.donorName}
                  detail={[toPickup && `${toPickup} from you`, t.donorArea ?? t.pickupAddress].filter(Boolean).join(" · ")}
                />
                <Leg
                  icon={HOME}
                  label="Deliver to"
                  place={t.ngoName ?? "NGO"}
                  detail={[leg && `${leg} ride`, t.ngoArea ?? t.ngoAddress].filter(Boolean).join(" · ")}
                />
              </div>
              <p
                className={cn(
                  "mt-3 rounded-xl px-3 py-2 text-sm",
                  upcoming ? "bg-accent-50 text-accent-700" : "bg-cream-100 text-ink-600",
                )}
              >
                {upcoming ? (
                  <>
                    Pickup <span className="font-semibold">{formatDateTime(t.pickupAt)}</span> ({formatRelative(t.pickupAt)})
                  </>
                ) : (
                  <>Updated {formatDateTime(t.updatedAt)}</>
                )}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** One big switch-like button: volunteers flip it on the move. */
export function AvailabilityToggle({ available, disabled }: { available: boolean; disabled?: boolean }) {
  return (
    <form action={toggleAvailability.bind(null, !available)}>
      <SubmitButton
        variant="outline"
        disabled={disabled}
        block
        aria-pressed={available}
        pendingLabel="Updating…"
        className={cn(
          "h-14 justify-between rounded-full border-2 px-5 text-base",
          available ? "border-brand-600 bg-brand-50 text-brand-900 hover:bg-brand-100" : "border-ink-200 text-ink-700",
        )}
      >
        <span className="flex items-center gap-3">
          <span
            aria-hidden
            className={cn("size-3 rounded-full", available ? "bg-brand-600 ring-4 ring-brand-600/20" : "bg-ink-300")}
          />
          {available ? "Available for tasks" : "Unavailable"}
        </span>
        <span className="text-sm font-medium text-ink-500">{available ? "Go offline" : "Go online"}</span>
      </SubmitButton>
    </form>
  );
}
