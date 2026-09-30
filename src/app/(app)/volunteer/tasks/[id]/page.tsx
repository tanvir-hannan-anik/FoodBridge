import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { confirmTaskDelivery, confirmTaskPickup, declineTaskAction, releaseTaskAction, startDeliveryAction } from "@/app/actions/volunteer";
import { DeliveryProgress, DeliveryTaskFacts } from "@/components/delivery/delivery-status";
import { FoodIcon } from "@/components/donor/food-icon";
import { SafetyBadge } from "@/components/safety-badge";
import { DeliveryMap } from "@/components/map/delivery-map";
import { LazyMap } from "@/components/map/lazy-map";
import type { MapMarker } from "@/components/map/map-canvas";
import { TaskBadge } from "@/components/volunteer/task-list";
import { AcceptTaskForm, ProofForm } from "@/components/volunteer/volunteer-forms";
import { Alert, ButtonLink, Card, CardBody, CardHeader, EmptyState, Modal, SubmitButton, Textarea } from "@/components/ui";
import { requireRole } from "@/lib/auth/dal";
import { CATEGORY_LABEL, CONDITION_LABEL, UNIT_SHORT } from "@/lib/donations/meta";
import { directionsUrl, formatDistance, mapSearchUrl, toPoint, travelMinutes } from "@/lib/geo";
import { getDeliveryView } from "@/lib/location/service";
import { formatDateTime, formatRelative } from "@/lib/utils";
import { RELEASABLE, TASK_META, taskStage, type ProofStep } from "@/lib/volunteer/meta";
import { getVolunteerTask, sweepVolunteerTasks, type VolunteerTask } from "@/lib/volunteer/service";

export const metadata: Metadata = { title: "Task" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function VolunteerTaskPage({ params, searchParams }: PageProps<"/volunteer/tasks/[id]">) {
  const volunteer = await requireRole("volunteer");
  const [{ id }, { accepted }] = await Promise.all([params, searchParams]);
  if (!UUID.test(id)) notFound();

  await sweepVolunteerTasks(volunteer.id);
  const verified = volunteer.status === "active";
  const found = await getVolunteerTask(volunteer, id);
  // Unverified volunteers never see open tasks' addresses.
  const t = found && (found.mine || verified) ? found : null;
  if (!t) {
    return (
      <div className="mx-auto max-w-xl">
        <Card>
          <EmptyState
            title="This task is no longer available"
            description="It may have gone to another volunteer, or the donation was cancelled or expired."
            action={<ButtonLink href="/volunteer">Back to dashboard</ButtonLink>}
          />
        </Card>
      </div>
    );
  }

  const stage = taskStage(t.status, t.offeredToMe);
  const view = t.mine ? await getDeliveryView(volunteer, t.id) : null;
  const quantity = `${t.quantity} ${UNIT_SHORT[t.unit]} (~${t.mealsEstimate} meals)`;

  // Before accepting: a static preview of the route (no live sharing yet).
  const pickup = toPoint(t.pickupLat, t.pickupLng);
  const delivery = toPoint(t.deliveryLat, t.deliveryLng);
  const base = toPoint(volunteer.lat, volunteer.lng);
  const preview: MapMarker[] = [
    ...(base ? [{ id: "me", point: base, kind: "volunteer" as const, glyph: "V", title: "You (saved location)" }] : []),
    ...(pickup ? [{ id: "pickup", point: pickup, kind: "pickup" as const, glyph: "D", title: `Pickup: ${t.donorName}` }] : []),
    ...(delivery ? [{ id: "delivery", point: delivery, kind: "delivery" as const, glyph: "N", title: `Delivery: ${t.ngoName ?? "NGO"}` }] : []),
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={t.mine ? "/volunteer/tasks" : "/volunteer"} className="text-sm font-medium text-ink-500 hover:text-brand-800">
        ← {t.mine ? "My tasks" : "Dashboard"}
      </Link>

      {accepted && stage === "accepted" && (
        <Alert tone="success" title="Task accepted!" className="mt-4">
          The donor and NGO have been notified. Head to the pickup address at the pickup time.
        </Alert>
      )}

      {/* Summary */}
      <section className="grain relative mt-4 overflow-hidden rounded-[1.75rem] bg-brand-950 p-5 text-cream-50 sm:p-7">
        <div aria-hidden className="absolute -top-24 -right-16 size-72 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <FoodIcon category={t.category} className="size-12 rounded-2xl" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl leading-tight font-semibold sm:text-3xl">{t.foodType}</h1>
              <TaskBadge stage={stage} />
              {["assigned", "open", "accepted"].includes(stage) && <SafetyBadge expiresAt={t.expiresAt} />}
            </div>
            <p className="mt-1 text-sm text-brand-200">
              {quantity} · pickup {formatDateTime(t.pickupAt)}
              {t.toPickupKm !== null && ` · ${formatDistance(t.toPickupKm)} from you`}
            </p>
          </div>
        </div>
        {stage !== "closed" && stage !== "open" && (
          <div className="relative mt-6">
            <DeliveryProgress status={t.status} pendingOffer={t.offeredToMe} dark />
          </div>
        )}
      </section>

      {/* The one next action, first on mobile. */}
      <Card className="mt-5 border-brand-600/30">
        <CardBody className="space-y-4 p-5">
          <p className="text-sm text-ink-700">
            <span className="font-semibold text-brand-950">{TASK_META[stage].label}.</span> {TASK_META[stage].next}
            {stage === "closed" && t.cancelReason && <span className="block text-ink-500">Reason: {t.cancelReason}</span>}
          </p>

          {(stage === "assigned" || stage === "open") &&
            (verified && volunteer.available ? (
              <>
                {t.offerExpiresAt && (
                  <p className="rounded-xl bg-accent-50 px-4 py-3 text-sm text-accent-700">
                    Please reply by <strong>{formatDateTime(t.offerExpiresAt)}</strong> ({formatRelative(t.offerExpiresAt)}). After that it goes to the
                    next volunteer.
                  </p>
                )}
                <AcceptTaskForm donationId={t.id} />
                {stage === "assigned" && (
                  <Modal triggerLabel="Decline" title="Decline this pickup?" description="It goes straight to the next nearest volunteer.">
                    <form action={declineTaskAction.bind(null, t.id)} className="space-y-4">
                      <Textarea label="Reason" name="reason" optional rows={2} maxLength={200} placeholder="e.g. Too far from me right now" />
                      <SubmitButton variant="danger" block pendingLabel="Declining…">
                        Decline task
                      </SubmitButton>
                    </form>
                  </Modal>
                )}
              </>
            ) : (
              <Alert tone="warning">
                {verified ? "Switch to Available on your dashboard to accept tasks." : "You can accept tasks once your account is verified."}
              </Alert>
            ))}

          {stage === "accepted" && (
            <>
              <ProofForm action={confirmTaskPickup.bind(null, t.id)} label="Confirm pickup" notePlaceholder="e.g. Collected 20 plates, sealed containers." />
              {RELEASABLE.includes(t.status) && (
                <Modal
                  triggerLabel="Can’t make it?"
                  triggerVariant="ghost"
                  title="Hand this task back?"
                  description="We’ll offer it to the next nearest volunteer and tell the donor and NGO."
                >
                  <form action={releaseTaskAction.bind(null, t.id)} className="space-y-4">
                    <Textarea label="Reason" name="reason" optional rows={2} maxLength={200} placeholder="e.g. Bike broke down" />
                    <SubmitButton variant="danger" block pendingLabel="Handing back…">
                      Hand back task
                    </SubmitButton>
                  </form>
                </Modal>
              )}
            </>
          )}

          {stage === "picked_up" && (
            <>
              <form action={startDeliveryAction.bind(null, t.id)}>
                <SubmitButton block size="lg" pendingLabel="Starting…" className="h-14 rounded-full text-lg">
                  Start delivery · I’m on my way
                </SubmitButton>
              </form>
              <details className="rounded-2xl border border-cream-200 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-brand-900">Already at the NGO? Confirm delivery</summary>
                <div className="mt-4">
                  <ProofForm action={confirmTaskDelivery.bind(null, t.id)} label="Confirm delivery" notePlaceholder="e.g. Handed over to the kitchen manager." />
                </div>
              </details>
            </>
          )}

          {stage === "in_transit" && (
            <ProofForm action={confirmTaskDelivery.bind(null, t.id)} label="Confirm delivery" notePlaceholder="e.g. Handed over to the kitchen manager." />
          )}
        </CardBody>
      </Card>

      <Card className="mt-5">
        <CardHeader title="Delivery task" description="What to carry, where from, where to, and by when." />
        <CardBody>
          <DeliveryTaskFacts
            t={{
              foodType: t.foodType,
              quantity,
              donorName: t.donorName,
              pickupAddress: t.pickupAddress,
              pickupAt: t.pickupAt,
              ngoName: t.ngoName,
              deliveryAddress: t.ngoAddress ?? t.ngoArea,
              deliverBy: t.deliverBy,
              expiresAt: t.expiresAt,
              distanceKm: t.deliveryKm,
            }}
          />
        </CardBody>
      </Card>

      <Card className="mt-5">
        <CardHeader title="Map & route" description="You → donor → NGO. Distances are straight-line estimates." />
        <CardBody>
          {view ? (
            <DeliveryMap initial={view} />
          ) : (
            <div className="space-y-3">
              {preview.length ? <LazyMap markers={preview} route={preview.map((m) => m.point)} /> : null}
              <p className="text-sm text-ink-600">
                {t.toPickupKm !== null && (
                  <>
                    You → pickup: <strong>{formatDistance(t.toPickupKm)}</strong> (~{travelMinutes(t.toPickupKm)} min).{" "}
                  </>
                )}
                {t.deliveryKm !== null && (
                  <>
                    Pickup → NGO: <strong>{formatDistance(t.deliveryKm)}</strong> (~{travelMinutes(t.deliveryKm)} min).
                  </>
                )}
                {t.toPickupKm === null && t.deliveryKm === null && "Exact pins aren’t set yet; use the addresses below."}
              </p>
              <a
                href={directionsUrl({
                  destination: { point: delivery, address: t.ngoAddress ?? t.ngoArea },
                  waypoints: [{ point: pickup, address: t.pickupAddress }],
                })}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center rounded-full border border-brand-900/15 px-4 text-sm font-semibold text-brand-900 hover:bg-cream-100"
              >
                Preview route in Google Maps ↗
              </a>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Place
          title="Pick up from"
          name={t.donorName}
          address={t.pickupAddress}
          mapHref={mapSearchUrl(pickup, t.pickupAddress)}
          contact={t.donorContact}
          when={`Ready ${formatDateTime(t.pickupAt)}`}
        />
        <Place
          title="Deliver to"
          name={t.ngoName ?? "NGO"}
          address={t.ngoAddress ?? t.ngoArea}
          mapHref={mapSearchUrl(delivery, t.ngoAddress ?? t.ngoArea)}
          contact={t.ngoContactInfo}
          when={t.deliverBy ? `By ${formatDateTime(t.deliverBy)}` : undefined}
        />
      </div>

      {(t.pickup || t.transit || t.delivery) && (
        <Card className="mt-5">
          <CardHeader title="Confirmations" />
          <CardBody className="space-y-4">
            {t.pickup && <Proof label="Picked up" step="pickup" taskId={t.id} event={t.pickup} />}
            {t.transit && <Proof label="Started delivery" taskId={t.id} event={t.transit} />}
            {t.delivery && <Proof label="Delivered" step="delivery" taskId={t.id} event={t.delivery} />}
          </CardBody>
        </Card>
      )}

      <Card className="mt-5">
        <CardHeader title="Food information" />
        <CardBody>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Detail label="Category">{CATEGORY_LABEL[t.category]}</Detail>
            <Detail label="Quantity">
              {t.quantity} {UNIT_SHORT[t.unit]}
            </Detail>
            <Detail label="Condition">{CONDITION_LABEL[t.condition].split(" — ")[0]}</Detail>
            <Detail label="Best before">
              {formatDateTime(t.expiresAt)}
              {stage !== "completed" && stage !== "delivered" && stage !== "closed" && (
                <span className="block text-ink-500">{formatRelative(t.expiresAt)}</span>
              )}
            </Detail>
            {t.instructions && (
              <Detail label="Donor’s instructions" wide>
                <span className="block rounded-xl bg-cream-100 px-4 py-3">{t.instructions}</span>
              </Detail>
            )}
          </dl>
          {t.hasImage && (
            // eslint-disable-next-line @next/next/no-img-element -- private, auth-checked image route
            <img
              src={`/volunteer/tasks/${t.id}/image`}
              alt={`Photo of ${t.foodType}`}
              loading="lazy"
              className="mt-5 max-h-72 w-full rounded-2xl border border-cream-200 object-cover"
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Place({
  title,
  name,
  address,
  mapHref,
  contact,
  when,
}: {
  title: string;
  name: string;
  address: string | null;
  mapHref: string;
  contact: { name: string; phone: string | null } | null;
  when?: string;
}) {
  return (
    <Card>
      <CardBody className="space-y-3 p-5">
        <p className="text-xs font-semibold tracking-widest text-ink-500 uppercase">{title}</p>
        <div>
          <p className="font-semibold text-brand-950">{name}</p>
          {address && <p className="text-sm text-ink-600">{address}</p>}
          {when && <p className="mt-1 text-sm text-ink-500">{when}</p>}
        </div>
        <div className="flex flex-col gap-2">
          {contact?.phone ? (
            <a
              href={`tel:${contact.phone}`}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Call {contact.name.split(" ")[0]} · {contact.phone}
            </a>
          ) : (
            <p className="rounded-xl bg-cream-100 px-3 py-2 text-xs text-ink-500">Contact shared after you accept.</p>
          )}
          <a
            href={mapHref}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 items-center justify-center rounded-full border border-brand-900/15 px-4 text-sm font-semibold text-brand-900 hover:bg-cream-100"
          >
            Open in Maps ↗
          </a>
        </div>
      </CardBody>
    </Card>
  );
}

function Proof({
  label,
  step,
  taskId,
  event,
}: {
  label: string;
  step?: ProofStep;
  taskId: string;
  event: NonNullable<VolunteerTask["pickup"]>;
}) {
  return (
    <div className="flex gap-4">
      <span aria-hidden className="mt-1 size-2.5 shrink-0 rounded-full bg-brand-600" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold text-brand-950">
          {label} · <span className="font-normal text-ink-600">{formatDateTime(event.createdAt)}</span>
        </p>
        {event.note && <p className="mt-1 text-ink-700">{event.note}</p>}
        {step && event.hasPhoto && (
          // eslint-disable-next-line @next/next/no-img-element -- private, auth-checked image route
          <img
            src={`/volunteer/tasks/${taskId}/proof/${step}`}
            alt={`${label} photo`}
            loading="lazy"
            className="mt-2 max-h-56 rounded-xl border border-cream-200 object-cover"
          />
        )}
      </div>
    </div>
  );
}

function Detail({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={wide ? "col-span-full" : undefined}>
      <dt className="text-xs font-semibold tracking-widest text-ink-500 uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-brand-950">{children}</dd>
    </div>
  );
}
