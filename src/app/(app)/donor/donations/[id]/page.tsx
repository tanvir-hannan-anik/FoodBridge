import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { acceptFoodRequest, advanceDemo, cancelDonation, declineFoodRequest } from "@/app/actions/donations";
import { DeliveryProgress, deliveryHeadline } from "@/components/delivery/delivery-status";
import { FoodIcon } from "@/components/donor/food-icon";
import { SafetyBadge } from "@/components/safety-badge";
import { DeliveryMap } from "@/components/map/delivery-map";
import { StatusBadge } from "@/components/donor/status-badge";
import { DonationTimeline } from "@/components/donor/timeline";
import { Alert, Card, CardBody, CardHeader, Modal, SubmitButton, Textarea } from "@/components/ui";
import { requireRole } from "@/lib/auth/dal";
import {
  ACTIVE_STATUSES,
  CANCELLABLE,
  CATEGORY_LABEL,
  CONDITION_LABEL,
  FLOW,
  STATUS_META,
  UNIT_SHORT,
} from "@/lib/donations/meta";
import { DEMO_STEPS, getDonorDonation, sweepDonorDonations } from "@/lib/donations/service";
import { distanceKm, formatDistance, toPoint } from "@/lib/geo";
import { getDeliveryView } from "@/lib/location/service";
import { NGO_TYPE_LABEL } from "@/lib/ngo/meta";
import { cn, formatDateTime, formatRelative } from "@/lib/utils";

export const metadata: Metadata = { title: "Donation details" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SHORT_LABEL: Record<(typeof FLOW)[number], string> = {
  PENDING: "Posted",
  MATCHED: "Matched",
  ASSIGNED: "Assigned",
  PICKED_UP: "Picked up",
  IN_TRANSIT: "On the way",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

export default async function DonationDetailsPage({ params, searchParams }: PageProps<"/donor/donations/[id]">) {
  const donor = await requireRole("donor");
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  if (!UUID.test(id)) notFound();

  await sweepDonorDonations(donor.id);
  const d = await getDonorDonation(donor.id, id);
  if (!d) notFound();

  const canCancel = CANCELLABLE.includes(d.status);
  const stepIndex = FLOW.indexOf(d.status);
  const closed = stepIndex === -1; // cancelled / expired
  const reachedIndex = closed ? Math.max(...d.events.map((e) => FLOW.indexOf(e.status))) : stepIndex;
  const nextStep = process.env.DEMO_MODE === "true" ? DEMO_STEPS[d.status] : undefined;
  const view = d.ngo ? await getDeliveryView(donor, d.id) : null;
  const pickupPoint = toPoint(d.pickupLat, d.pickupLng);

  return (
    <>
      <Link href="/donor/donations" className="text-sm font-medium text-ink-500 hover:text-brand-800">
        ← My donations
      </Link>

      {created && (
        <Alert tone="success" title="Donation posted!" className="mt-4">
          We’re notifying NGOs nearby. You’ll get a notification as soon as one accepts.
        </Alert>
      )}

      {d.safetyFlag === "FLAGGED" && (
        <Alert tone="warning" title="Paused for a food-safety check" className="mt-4">
          NGOs can’t see or accept this food until FoodBridge finishes the check.{d.safetyNote && <> Note: {d.safetyNote}</>} If the food isn’t
          safe any more, please cancel it.
        </Alert>
      )}

      {d.parentId && (
        <Alert tone="info" className="mt-4">
          This is the remaining part of a larger donation: some of it was already allocated to an NGO.{" "}
          <Link href={`/donor/donations/${d.parentId}`} className="font-semibold underline">
            See the allocated part
          </Link>
        </Alert>
      )}

      {/* Summary banner */}
      <section className="grain relative mt-4 overflow-hidden rounded-[1.75rem] bg-brand-950 text-cream-50">
        <div aria-hidden className="absolute -top-24 -right-16 size-80 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <FoodIcon category={d.category} className="size-14 rounded-2xl" />
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-3xl leading-tight font-semibold">{d.foodType}</h1>
                  <StatusBadge status={d.status} />
                  {(CANCELLABLE.includes(d.status) || d.safetyFlag) && <SafetyBadge expiresAt={d.expiresAt} safetyFlag={d.safetyFlag} />}
                </div>
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-brand-200">
                  <span>
                    {d.quantity} {UNIT_SHORT[d.unit]}
                  </span>
                  <span>~{d.mealsEstimate} meals</span>
                  <span>Posted {formatDateTime(d.createdAt)}</span>
                </p>
              </div>
            </div>
            {canCancel && (
              <Modal
                triggerLabel="Cancel donation"
                title="Cancel this donation?"
                description="The NGO and volunteer (if any) will be told it’s no longer available."
              >
                <form action={cancelDonation.bind(null, d.id)} className="space-y-4">
                  <Textarea
                    label="Reason"
                    name="reason"
                    optional
                    rows={2}
                    maxLength={200}
                    placeholder="e.g. Food was already given away"
                  />
                  <SubmitButton variant="danger" block pendingLabel="Cancelling…">
                    Yes, cancel donation
                  </SubmitButton>
                </form>
              </Modal>
            )}
          </div>

          {/* Progress */}
          <ol aria-label="Donation progress" className="mt-8 grid grid-cols-7 gap-1.5 sm:gap-2">
            {FLOW.map((step, i) => {
              const done = i <= reachedIndex;
              const current = !closed && i === stepIndex;
              return (
                <li key={step} aria-current={current ? "step" : undefined}>
                  <span
                    className={cn(
                      "block h-1.5 rounded-full",
                      done ? (closed ? "bg-brand-300/50" : "bg-accent-400") : "bg-cream-50/15",
                    )}
                  />
                  <span
                    className={cn(
                      "mt-2 hidden text-xs sm:block",
                      current ? "font-semibold text-accent-300" : done ? "text-cream-100" : "text-brand-300/70",
                    )}
                  >
                    {SHORT_LABEL[step]}
                  </span>
                  <span className="sr-only">{done ? " (done)" : " (not yet)"}</span>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-sm text-cream-100 sm:hidden">
            Step {Math.min(reachedIndex + 1, FLOW.length)} of {FLOW.length}: {STATUS_META[d.status].label}
          </p>
        </div>
      </section>

      {d.status === "CANCELLED" && d.cancelReason && (
        <Alert tone="info" className="mt-6">
          Cancelled: {d.cancelReason}
        </Alert>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {d.status === "PENDING" && (
            <Card className="overflow-hidden">
              <CardHeader
                title="Requests from NGOs"
                description={
                  d.requests.length
                    ? "Accept the NGO that should receive this food. The others are told automatically."
                    : "Nearby NGOs can see your donation. Their requests will appear here."
                }
              />
              {d.requests.length ? (
                <ul className="divide-y divide-cream-200">
                  {d.requests.map((r) => {
                    const ngoName = r.ngoName ?? r.ngoContact;
                    const away = formatDistance(distanceKm(pickupPoint, toPoint(r.ngoLat, r.ngoLng)));
                    return (
                      <li key={r.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-start">
                        <span
                          aria-hidden
                          className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-950 font-display text-base font-semibold text-accent-300"
                        >
                          {ngoName[0]}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-brand-950">
                            {ngoName}
                            <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-800">
                              ✓ Verified
                            </span>
                          </p>
                          <p className="mt-0.5 text-sm text-ink-500">
                            {r.ngoType ? NGO_TYPE_LABEL[r.ngoType] : "NGO"}
                            {r.ngoArea && <> · {r.ngoArea}</>}
                            {away && <> · {away} away</>}
                          </p>
                          <p className="mt-2 text-sm text-ink-700">
                            Wants{" "}
                            <strong>
                              {r.quantity} {UNIT_SHORT[d.unit]}
                            </strong>{" "}
                            to feed <strong>{r.people} people</strong>, pickup around {formatDateTime(r.preferredAt)}.
                          </p>
                          {r.notes && (
                            <p className="mt-2 rounded-xl bg-cream-100 px-3 py-2 text-sm text-ink-700">“{r.notes}”</p>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <form action={declineFoodRequest.bind(null, r.id)}>
                            <SubmitButton variant="outline" size="sm" className="rounded-full px-4">
                              Decline
                            </SubmitButton>
                          </form>
                          <form action={acceptFoodRequest.bind(null, r.id)}>
                            <SubmitButton size="sm" className="rounded-full px-4" pendingLabel="Accepting…">
                              Accept
                            </SubmitButton>
                          </form>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="px-6 py-6 text-sm text-ink-500">No requests yet. We’ll notify you when an NGO asks for it.</p>
              )}
            </Card>
          )}

          {view && (
            <Card>
              <CardHeader title="Delivery" description={deliveryHeadline(d.status, view.pendingOffer, d.volunteer?.name)} />
              <CardBody className="space-y-5">
                {!closed && <DeliveryProgress status={d.status} pendingOffer={view.pendingOffer} />}
                <DeliveryMap initial={view} />
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Tracking" description={STATUS_META[d.status].description} />
            <CardBody>
              <DonationTimeline status={d.status} events={d.events} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Food details" />
            <CardBody>
              <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <Detail label="Category">{CATEGORY_LABEL[d.category]}</Detail>
                <Detail label="Quantity">
                  {d.quantity} {UNIT_SHORT[d.unit]} · ~{d.mealsEstimate} meals
                </Detail>
                <Detail label="Condition">{CONDITION_LABEL[d.condition].split(" — ")[0]}</Detail>
                <Detail label="Prepared at">{formatDateTime(d.preparedAt)}</Detail>
                <Detail label="Best before">
                  {formatDateTime(d.expiresAt)}
                  {ACTIVE_STATUSES.slice(0, 3).includes(d.status) && (
                    <span className="ml-1 text-ink-500">({formatRelative(d.expiresAt)})</span>
                  )}
                </Detail>
                {d.instructions && (
                  <Detail label="Special instructions" wide>
                    <span className="block rounded-xl bg-cream-100 px-4 py-3">{d.instructions}</span>
                  </Detail>
                )}
              </dl>
              {d.hasImage && (
                // eslint-disable-next-line @next/next/no-img-element -- private, auth-checked image route
                <img
                  src={`/donor/donations/${d.id}/image`}
                  alt={`Photo of ${d.foodType}`}
                  loading="lazy"
                  className="mt-6 max-h-80 w-full rounded-2xl border border-cream-200 object-cover"
                />
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Pickup" />
            <CardBody>
              <dl className="space-y-5">
                <Detail label="Ready from">{formatDateTime(d.pickupAt)}</Detail>
                <Detail label="Address">
                  {d.pickupAddress}
                  {!pickupPoint && <span className="mt-1 block text-xs text-ink-500">No map pin: distances use your area.</span>}
                </Detail>
                {d.deliveryAddress && (
                  <Detail label="Delivering to">
                    {d.deliveryAddress}
                    {d.deliverBy && <span className="block text-ink-500">by {formatDateTime(d.deliverBy)}</span>}
                  </Detail>
                )}
                <Detail label="Contact">
                  {d.contactName}
                  <a
                    href={`tel:${d.contactPhone}`}
                    className="mt-1 block font-semibold text-brand-700 hover:underline"
                  >
                    {d.contactPhone}
                  </a>
                </Detail>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Who’s helping" />
            <CardBody className="space-y-5">
              <Partner
                label="NGO"
                initials="N"
                name={d.ngo?.name ?? d.ngo?.contact}
                phone={d.ngo?.phone}
                waiting="Waiting for an NGO to accept."
              />
              <Partner
                label="Volunteer"
                initials="V"
                name={d.volunteer?.name}
                phone={d.volunteer?.phone}
                waiting={d.ngo ? deliveryHeadline(d.status, view?.pendingOffer ?? false) : "Assigned after an NGO accepts."}
              />
            </CardBody>
          </Card>

          {nextStep && (
            <section className="rounded-card border border-dashed border-accent-500/50 bg-accent-50 p-6">
              <p className="text-xs font-semibold tracking-widest text-accent-700 uppercase">Demo mode</p>
              <p className="mt-2 text-sm text-ink-700">
                Skip the volunteer login: play the volunteer’s part to test the flow.
              </p>
              <form action={advanceDemo.bind(null, d.id)} className="mt-4">
                <SubmitButton variant="primary" block pendingLabel="Updating…" className="rounded-full">
                  Move to “{STATUS_META[nextStep].label}”
                </SubmitButton>
              </form>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

function Detail({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-semibold tracking-widest text-ink-500 uppercase">{label}</dt>
      <dd className="mt-1.5 text-sm text-brand-950">{children}</dd>
    </div>
  );
}

function Partner({
  label,
  initials,
  name,
  phone,
  waiting,
}: {
  label: string;
  initials: string;
  name?: string | null;
  phone?: string | null;
  waiting: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-full font-display text-base font-semibold",
          name ? "bg-brand-950 text-accent-300" : "border border-dashed border-ink-300 text-ink-500",
        )}
      >
        {name ? name[0] : initials}
      </span>
      <div className="min-w-0 text-sm">
        <p className="text-xs font-semibold tracking-widest text-ink-500 uppercase">{label}</p>
        {name ? (
          <>
            <p className="mt-0.5 font-semibold text-brand-950">{name}</p>
            {phone && (
              <a href={`tel:${phone}`} className="text-brand-700 hover:underline">
                {phone}
              </a>
            )}
          </>
        ) : (
          <p className="mt-0.5 text-ink-500">{waiting}</p>
        )}
      </div>
    </div>
  );
}
