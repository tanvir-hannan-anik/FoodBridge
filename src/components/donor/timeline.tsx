import type { DonationStatus } from "@/db/schema";
import { FLOW, STATUS_META } from "@/lib/donations/meta";
import { cn, formatDateTime } from "@/lib/utils";

type Event = { status: DonationStatus; note: string | null; createdAt: Date };

/**
 * Shows the fixed Created → Match → Assign → Pickup → In transit → Delivery → Complete path, with times for
 * the steps already reached. A cancelled/expired donation ends the line with that event.
 */
export function DonationTimeline({ status, events }: { status: DonationStatus; events: Event[] }) {
  // Latest event per step, except "Created" (the first PENDING; a cancelled match re-opens the donation later).
  const reached = new Map<DonationStatus, Event>();
  for (const e of events) if (e.status !== "PENDING" || !reached.has("PENDING")) reached.set(e.status, e);
  const terminal = status === "CANCELLED" || status === "EXPIRED" ? reached.get(status) : undefined;
  const steps = terminal ? FLOW.filter((s) => reached.has(s)).concat(status) : FLOW;
  const currentIndex = steps.indexOf(status);

  return (
    <ol className="relative">
      {steps.map((step, i) => {
        const event = reached.get(step);
        const done = i <= currentIndex;
        const isCurrent = i === currentIndex;
        const bad = step === "CANCELLED" || step === "EXPIRED";
        return (
          <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={cn("absolute top-7 bottom-0 left-3.5 w-0.5", i < currentIndex ? "bg-brand-500" : "bg-cream-200")}
              />
            )}
            <span
              className={cn(
                "relative z-10 grid size-7 shrink-0 place-items-center rounded-full text-white",
                bad ? "bg-red-500" : done ? "bg-brand-600" : "border-2 border-cream-300 bg-white",
                isCurrent && !bad && "ring-4 ring-accent-200",
              )}
            >
              {done && !bad && (
                <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className="size-4">
                  <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z" />
                </svg>
              )}
              {bad && (
                <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className="size-4">
                  <path d="M6.3 5.3a1 1 0 0 0-1.4 1.4L8.6 10l-3.7 3.3a1 1 0 1 0 1.4 1.4L10 11.4l3.3 3.3a1 1 0 0 0 1.4-1.4L11.4 10l3.3-3.3a1 1 0 0 0-1.4-1.4L10 8.6 6.3 5.3Z" />
                </svg>
              )}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className={cn("text-sm font-semibold", done ? "text-brand-950" : "text-ink-500")}>
                {step === "PENDING" ? "Created" : STATUS_META[step].label}
                {isCurrent && <span className="sr-only"> (current step)</span>}
              </p>
              {event && done ? (
                <p className="text-xs text-ink-500">
                  {formatDateTime(event.createdAt)}
                  {event.note && <> · {event.note}</>}
                </p>
              ) : (
                <p className="text-xs text-ink-500">{STATUS_META[step].description}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
