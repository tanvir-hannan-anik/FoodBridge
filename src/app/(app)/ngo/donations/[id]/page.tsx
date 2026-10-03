import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { advanceDemoAsNgo, markCompleted, markReceived, requestFood, withdrawRequest } from "@/app/actions/ngo";
import { FoodIcon } from "@/components/donor/food-icon";
import { SafetyBadge } from "@/components/safety-badge";
import { DonationTimeline } from "@/components/donor/timeline";
import { DeliveryProgress, deliveryHeadline } from "@/components/delivery/delivery-status";
import { DeliveryMap } from "@/components/map/delivery-map";
import { CompleteForm } from "@/components/ngo/complete-form";
import { RequestForm } from "@/components/ngo/request-form";
import { CancelMatchForm, MatchActions } from "@/components/requests/match-actions";
import { MatchBadge, MatchStepper } from "@/components/requests/match-status";
import { StageBadge } from "@/components/ngo/stage-badge";
import { Alert, Badge, Card, CardBody, CardHeader, SubmitButton } from "@/components/ui";
import { requireRole } from "@/lib/auth/dal";
import {
  CATEGORY_LABEL,
  CONDITION_LABEL,
  DONOR_TYPE_LABEL,
  FLOW,
  STATUS_META,
  UNIT_SHORT,
} from "@/lib/donations/meta";
import { DEMO_STEPS, expireOverdueDonations } from "@/lib/donations/service";
import { distanceKm, formatDistance, toPoint } from "@/lib/geo";
import { getDeliveryView } from "@/lib/location/service";
import { matchStage, UNMATCHABLE } from "@/lib/matching/meta";
import { REQUEST_CLOSED_REASON, STAGE_META, requestStage } from "@/lib/ngo/meta";
import { getNgoDonation } from "@/lib/ngo/service";
import { getI18n } from "@/lib/i18n-server";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Donation") };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function NgoDonationPage({ params, searchParams }: PageProps<"/ngo/donations/[id]">) {
  const ngo = await requireRole("ngo");
  const [{ id }, { requested, accepted }] = await Promise.all([params, searchParams]);
  if (!UUID.test(id)) notFound();

  await expireOverdueDonations();
  const d = await getNgoDonation(ngo.id, id);
  if (!d) notFound();

  const verified = ngo.status === "active";
  const stage = d.request ? requestStage(d.request.status, d.status) : null;
  const open = d.status === "PENDING" && d.expiresAt > new Date();
  const canRequest = open && (!d.request || d.request.status === "CANCELLED" || d.request.status === "SKIPPED");
  const matchWaiting = d.request?.status === "MATCHED" && open;
  const stepIndex = FLOW.indexOf(d.status);
  const demoNext = process.env.DEMO_MODE === "true" && d.matchedToMe ? DEMO_STEPS[d.status] : undefined;
  const view = d.matchedToMe ? await getDeliveryView(ngo, d.id) : null;
  const match = d.request ? matchStage(d.request.status, d.request.allocatedAt, d.status) : null;
  const canCancelMatch = d.matchedToMe && d.request?.status === "ACCEPTED" && UNMATCHABLE.includes(d.status);
  const rawAway = formatDistance(distanceKm(toPoint(d.pickupLat, d.pickupLng), toPoint(ngo.lat, ngo.lng)));
  const { t, dateTime, relative, number } = await getI18n();
  const away = rawAway && t(rawAway);

  return (
    <>
      <Link href={d.request ? "/ngo/requests" : "/ngo/donations"} className="text-sm font-medium text-ink-500 hover:text-brand-800">
        ← {t(d.request ? "Food requests" : "Available donations")}
      </Link>

      {accepted && d.matchedToMe && (
        <Alert tone="success" title="Food accepted!" className="mt-4">
          {t("It’s matched to your request. The donor has been notified and a volunteer will be assigned to bring it.")}
        </Alert>
      )}

      {requested && d.request?.status === "PENDING" && (
        <Alert tone="success" title="Request sent!" className="mt-4">
          {t("The donor has been notified. You’ll get a notification when they respond.")}
        </Alert>
      )}

      {/* Summary banner */}
      <section className="grain relative mt-4 overflow-hidden rounded-[1.75rem] bg-brand-950 text-cream-50">
        <div aria-hidden className="absolute -top-24 -right-16 size-80 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <FoodIcon category={d.category} className="size-14 rounded-2xl" />
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl leading-tight font-semibold">{d.foodType}</h1>
                {stage ? <StageBadge stage={stage} /> : open ? <Badge tone="brand">Available</Badge> : null}
                {["PENDING", "MATCHED", "ASSIGNED"].includes(d.status) && <SafetyBadge expiresAt={d.expiresAt} safetyFlag={d.safetyFlag} />}
              </div>
              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-brand-200">
                <span>
                  {number(d.quantity)} {t(UNIT_SHORT[d.unit])}
                </span>
                <span>{t("~{n} meals", { n: d.mealsEstimate })}</span>
                <span>{t("from {name}", { name: d.donorName })}</span>
                {away && <span>{t("{d} from you", { d: away })}</span>}
              </p>
            </div>
          </div>

          {d.matchedToMe && stepIndex > 0 && (
            <ol aria-label={t("Delivery progress")} className="mt-8 grid grid-cols-6 gap-1.5 sm:gap-2">
              {FLOW.slice(1).map((step, i) => {
                const done = i + 1 <= stepIndex;
                const current = i + 1 === stepIndex;
                return (
                  <li key={step} aria-current={current ? "step" : undefined}>
                    <span className={cn("block h-1.5 rounded-full", done ? "bg-accent-400" : "bg-cream-50/15")} />
                    <span
                      className={cn(
                        "mt-2 hidden text-xs sm:block",
                        current ? "font-semibold text-accent-300" : done ? "text-cream-100" : "text-brand-300/70",
                      )}
                    >
                      {t(STATUS_META[step].label)}
                    </span>
                    <span className="sr-only">{done ? ` ${t("(done)")}` : ` ${t("(not yet)")}`}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="space-y-6 lg:col-span-2">
          {view && (
            <Card>
              <CardHeader title="Delivery" description={t(deliveryHeadline(d.status, view.pendingOffer, d.volunteer?.name))} />
              <CardBody className="space-y-5">
                {d.status !== "CANCELLED" && d.status !== "EXPIRED" && <DeliveryProgress status={d.status} pendingOffer={view.pendingOffer} />}
                <DeliveryMap initial={view} />
              </CardBody>
            </Card>
          )}

          {d.matchedToMe && (
            <Card>
              <CardHeader title="Tracking" description={STATUS_META[d.status].description} />
              <CardBody>
                <DonationTimeline status={d.status} events={d.events} />
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Food information" />
            <CardBody>
              <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <Detail label="Category">{t(CATEGORY_LABEL[d.category])}</Detail>
                <Detail label="Quantity">
                  {number(d.quantity)} {t(UNIT_SHORT[d.unit])} · {t("~{n} meals", { n: d.mealsEstimate })}
                </Detail>
                <Detail label="Condition">{t(CONDITION_LABEL[d.condition]).split(" — ")[0]}</Detail>
                <Detail label="Prepared at">{dateTime(d.preparedAt)}</Detail>
                <Detail label="Best before">
                  {dateTime(d.expiresAt)}
                  {open && <span className="ml-1 text-ink-500">({relative(d.expiresAt)})</span>}
                </Detail>
                <Detail label="Ready for pickup">{dateTime(d.pickupAt)}</Detail>
                {d.instructions && (
                  <Detail label="Donor’s instructions" wide>
                    <span className="block rounded-xl bg-cream-100 px-4 py-3">{d.instructions}</span>
                  </Detail>
                )}
              </dl>
              {d.hasImage && (
                // eslint-disable-next-line @next/next/no-img-element -- private, auth-checked image route
                <img
                  src={`/ngo/donations/${d.id}/image`}
                  alt={t("Photo of {food}", { food: d.foodType })}
                  loading="lazy"
                  className="mt-6 max-h-80 w-full rounded-2xl border border-cream-200 object-cover"
                />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Donor & location" />
            <CardBody>
              <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <Detail label="Donor">
                  {d.donorName}
                  {d.donorType && <span className="block text-ink-500">{t(DONOR_TYPE_LABEL[d.donorType]).split(" (")[0]}</span>}
                </Detail>
                <Detail label="Area">
                  {d.donorArea ?? "—"}
                  {away && <span className="block text-ink-500">{t("{d} from you (straight line)", { d: away })}</span>}
                </Detail>
                <Detail label="Pickup address" wide>
                  {d.pickupAddress}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.pickupAddress)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block font-semibold text-brand-700 hover:underline"
                  >
                    {t("Open in Maps")} ↗
                  </a>
                </Detail>
                <Detail label="Contact" wide>
                  {d.contact ? (
                    <>
                      {d.contact.name} ·{" "}
                      <a href={`tel:${d.contact.phone}`} className="font-semibold text-brand-700 hover:underline">
                        {d.contact.phone}
                      </a>
                    </>
                  ) : (
                    <span className="text-ink-500">{t("Shared with you once the donor accepts your request.")}</span>
                  )}
                </Detail>
              </dl>
            </CardBody>
          </Card>
        </div>

        {/* Action column */}
        <div className="space-y-6">
          {canRequest && !verified && (
            <Alert tone="warning" title="Verification pending">
              {t("You can request food once our team has verified your NGO.")}
            </Alert>
          )}

          {canRequest && verified && (
            <Card>
              <CardHeader title="Request this food" description="The donor reviews requests and picks one NGO." />
              <CardBody>
                <RequestForm
                  action={requestFood.bind(null, d.id)}
                  maxQuantity={d.quantity}
                  unitLabel={t(UNIT_SHORT[d.unit])}
                  defaultPeople={d.mealsEstimate}
                  pickupAt={d.pickupAt.toISOString()}
                  expiresAt={d.expiresAt.toISOString()}
                />
              </CardBody>
            </Card>
          )}

          {matchWaiting && d.request && (
            <Card className="border-sky-300">
              <CardHeader title="Matched to your food request" description={STAGE_META.matched.description} />
              <CardBody className="space-y-4">
                {d.request.needId && (
                  <Link href={`/ngo/requests/${d.request.needId}`} className="text-sm font-semibold text-brand-700 hover:underline">
                    {t("View your request")} →
                  </Link>
                )}
                <MatchActions requestId={d.request.id} donationId={d.id} />
              </CardBody>
            </Card>
          )}

          {d.request && !["CANCELLED", "SKIPPED", "MATCHED"].includes(d.request.status) && (
            <Card>
              <CardHeader title="Your request" description={stage ? STAGE_META[stage].description : undefined} />
              <CardBody className="space-y-4">
                {match && (
                  <div className="space-y-2">
                    <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-ink-500 uppercase">
                      {t("Match status")} <MatchBadge stage={match} />
                    </p>
                    <MatchStepper stage={match} />
                  </div>
                )}
                <dl className="grid grid-cols-2 gap-4">
                  <Detail label="Quantity">
                    {number(d.request.quantity)} {t(UNIT_SHORT[d.unit])}
                  </Detail>
                  <Detail label="People">{number(d.request.people)}</Detail>
                  <Detail label="Preferred time" wide>
                    {dateTime(d.request.preferredAt)}
                  </Detail>
                  {d.request.notes && (
                    <Detail label="Notes" wide>
                      {d.request.notes}
                    </Detail>
                  )}
                </dl>
                {REQUEST_CLOSED_REASON[d.request.status] && (
                  <p className="rounded-xl bg-cream-100 px-4 py-3 text-sm text-ink-700">
                    {t(REQUEST_CLOSED_REASON[d.request.status]!)}
                  </p>
                )}
                {d.request.status === "PENDING" && (
                  <form action={withdrawRequest.bind(null, d.request.id, d.id)}>
                    <SubmitButton variant="outline" block className="rounded-full" pendingLabel="Withdrawing…">
                      {t("Withdraw request")}
                    </SubmitButton>
                  </form>
                )}
              </CardBody>
            </Card>
          )}

          {d.matchedToMe && (
            <Card>
              <CardHeader title="Pickup & delivery" />
              <CardBody className="space-y-5">
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-11 shrink-0 place-items-center rounded-full font-display text-base font-semibold",
                      d.volunteer ? "bg-brand-950 text-accent-300" : "border border-dashed border-ink-300 text-ink-500",
                    )}
                  >
                    {d.volunteer ? d.volunteer.name[0] : "V"}
                  </span>
                  <div className="text-sm">
                    <p className="text-xs font-semibold tracking-widest text-ink-500 uppercase">{t("Volunteer")}</p>
                    {d.volunteer ? (
                      <>
                        <p className="mt-0.5 font-semibold text-brand-950">{d.volunteer.name}</p>
                        <a href={`tel:${d.volunteer.phone}`} className="text-brand-700 hover:underline">
                          {d.volunteer.phone}
                        </a>
                      </>
                    ) : (
                      <p className="mt-0.5 text-ink-500">{t("A volunteer will be assigned soon.")}</p>
                    )}
                  </div>
                </div>
                <p className="rounded-xl bg-cream-100 px-4 py-3 text-sm text-ink-700">
                  <span className="font-semibold text-brand-950">{t(STATUS_META[d.status].label)}.</span>{" "}
                  {t(STATUS_META[d.status].description)}
                </p>

                {d.deliveryAddress && (
                  <p className="text-sm text-ink-600">
                    {t("Delivering to")} <span className="font-medium text-brand-950">{d.deliveryAddress}</span>
                    {d.deliverBy && <> · {t("by {time}", { time: dateTime(d.deliverBy) })}</>}
                  </p>
                )}
                {(d.status === "PICKED_UP" || d.status === "IN_TRANSIT") && (
                  <form action={markReceived.bind(null, d.id)}>
                    <SubmitButton block className="rounded-full" pendingLabel="Confirming…">
                      {t("Confirm food received")}
                    </SubmitButton>
                  </form>
                )}
                {d.status === "DELIVERED" && (
                  <CompleteForm action={markCompleted.bind(null, d.id)} defaultMeals={d.mealsEstimate} />
                )}
                {d.status === "COMPLETED" && (
                  <Alert tone="success" title="Distributed">
                    {t("{n} meals served. Thank you!", { n: d.mealsServed ?? d.mealsEstimate })}
                  </Alert>
                )}
                {canCancelMatch && d.request && <CancelMatchForm requestId={d.request.id} />}
              </CardBody>
            </Card>
          )}

          {demoNext && (
            <section className="rounded-card border border-dashed border-accent-500/50 bg-accent-50 p-6">
              <p className="text-xs font-semibold tracking-widest text-accent-700 uppercase">{t("Demo mode")}</p>
              <p className="mt-2 text-sm text-ink-700">{t("Skip the volunteer login: play the volunteer’s part.")}</p>
              <form action={advanceDemoAsNgo.bind(null, d.id)} className="mt-4">
                <SubmitButton block pendingLabel="Updating…" className="rounded-full">
                  {t("Move to “{label}”", { label: t(STATUS_META[demoNext].label) })}
                </SubmitButton>
              </form>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

async function Detail({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  const { t } = await getI18n();
  return (
    <div className={wide ? "col-span-full" : undefined}>
      <dt className="text-xs font-semibold tracking-widest text-ink-500 uppercase">{t(label)}</dt>
      <dd className="mt-1.5 text-sm text-brand-950">{children}</dd>
    </div>
  );
}
