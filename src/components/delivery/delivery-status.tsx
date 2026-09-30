import type { ReactNode } from "react";
import type { DonationStatus } from "@/db/schema";
import { formatDistance } from "@/lib/geo";
import { cn, formatDateTime, formatRelative } from "@/lib/utils";
import { DELIVERY_FLOW, DELIVERY_STEP_LABEL, taskStage } from "@/lib/volunteer/meta";

type Step = (typeof DELIVERY_FLOW)[number];

/** Where the delivery task is: Assigned → Accepted → Picked up → In transit → Delivered → Completed. */
export function DeliveryProgress({ status, pendingOffer, dark }: { status: DonationStatus; pendingOffer: boolean; dark?: boolean }) {
  const stage = taskStage(status, pendingOffer);
  const reached: number = stage === "open" ? -1 : DELIVERY_FLOW.indexOf(stage as Step);
  return (
    <ol aria-label="Delivery progress" className="grid grid-cols-6 gap-1.5">
      {DELIVERY_FLOW.map((step, i) => {
        const done = i < reached || stage === "completed";
        const current = i === reached && stage !== "completed";
        return (
          <li key={step} aria-current={current ? "step" : undefined}>
            <span
              className={cn(
                "block h-1.5 rounded-full",
                done ? (dark ? "bg-accent-400" : "bg-brand-600") : current ? (dark ? "bg-cream-50/60" : "bg-accent-400") : dark ? "bg-cream-50/15" : "bg-cream-200",
              )}
            />
            <span
              className={cn(
                "mt-1.5 block truncate text-[11px] sm:text-xs",
                dark
                  ? current
                    ? "font-semibold text-accent-300"
                    : done
                      ? "text-cream-100"
                      : "text-brand-300/70"
                  : current
                    ? "font-semibold text-brand-900"
                    : done
                      ? "text-ink-700"
                      : "text-ink-500",
              )}
            >
              {DELIVERY_STEP_LABEL[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** One sentence for donors and NGOs: what is happening with the delivery right now. */
export function deliveryHeadline(status: DonationStatus, pendingOffer: boolean, volunteerName?: string | null) {
  const who = volunteerName ?? "The volunteer";
  switch (taskStage(status, pendingOffer)) {
    case "assigned":
      return "Offered to the nearest available volunteer. Waiting for them to accept.";
    case "open":
      return "Looking for a volunteer. Every available volunteer can accept this pickup.";
    case "accepted":
      return `${who} accepted and is heading to the pickup.`;
    case "picked_up":
      return `${who} collected the food.`;
    case "in_transit":
      return `${who} is on the way to the NGO.`;
    case "delivered":
      return "Delivered to the NGO.";
    case "completed":
      return "Delivered and served. Thank you!";
    default:
      return "This delivery is closed.";
  }
}

type TaskFacts = {
  foodType: string;
  quantity: string;
  donorName: string;
  pickupAddress: string;
  pickupAt: Date;
  ngoName: string | null;
  deliveryAddress: string | null;
  deliverBy: Date | null;
  expiresAt: Date;
  distanceKm?: number | null;
};

/** The delivery task at a glance: food, quantity, pickup and delivery locations, and the required time. */
export function DeliveryTaskFacts({ t, children }: { t: TaskFacts; children?: ReactNode }) {
  const away = formatDistance(t.distanceKm);
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      <Fact label="Food">
        {t.foodType} · {t.quantity}
      </Fact>
      <Fact label="Required time">
        Pick up from {formatDateTime(t.pickupAt)}
        <span className="block text-ink-500">
          Deliver by {formatDateTime(t.deliverBy ?? t.expiresAt)} ({formatRelative(t.deliverBy ?? t.expiresAt)})
        </span>
      </Fact>
      <Fact label="Pickup (donor)">
        {t.donorName}
        <span className="block text-ink-500">{t.pickupAddress}</span>
      </Fact>
      <Fact label="Delivery (NGO)">
        {t.ngoName ?? "NGO"}
        {t.deliveryAddress && <span className="block text-ink-500">{t.deliveryAddress}</span>}
        {away && <span className="block text-ink-500">{away} from the pickup</span>}
      </Fact>
      {children}
    </dl>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-widest text-ink-500 uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-brand-950">{children}</dd>
    </div>
  );
}
