import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { cancelNeedAction, closeNeedAction } from "@/app/actions/requests";
import { FoodIcon } from "@/components/donor/food-icon";
import { StageBadge } from "@/components/ngo/stage-badge";
import { MatchActions } from "@/components/requests/match-actions";
import { MatchBadge, MatchHistory } from "@/components/requests/match-status";
import { NeedProgressBar } from "@/components/requests/need-list";
import { Alert, Card, CardBody, CardHeader, SubmitButton } from "@/components/ui";
import { requireRole } from "@/lib/auth/dal";
import { CATEGORY_LABEL, STATUS_META, UNIT_SHORT } from "@/lib/donations/meta";
import { STAGE_META, requestStage } from "@/lib/ngo/meta";
import { formatDistance } from "@/lib/geo";
import { explainMatch, matchStage } from "@/lib/matching/meta";
import { listMatchHistory } from "@/lib/matching/service";
import { needClosedReason } from "@/lib/requests/meta";
import { getNeed, matchOpenNeeds } from "@/lib/requests/service";
import { formatDateTime, formatRelative } from "@/lib/utils";

export const metadata: Metadata = { title: "Food request" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function NeedPage({ params, searchParams }: PageProps<"/ngo/requests/[id]">) {
  const ngo = await requireRole("ngo");
  const [{ id }, { created, updated }] = await Promise.all([params, searchParams]);
  if (!UUID.test(id)) notFound();

  if (ngo.status === "active") await matchOpenNeeds({ needId: id });
  const need = await getNeed(ngo.id, id);
  if (!need) notFound();
  const history = await listMatchHistory({ needId: need.id }, 30);

  const proposal = need.allocations.find((a) => a.status === "MATCHED");
  const accepted = need.allocations.filter((a) => a.status === "ACCEPTED");
  const title = need.foodType || (need.category ? CATEGORY_LABEL[need.category] : "Any food");
  const closedReason = need.stage === "cancelled" ? needClosedReason(need) : null;
  const canClose = need.status === "OPEN" && !need.editable;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/ngo/requests" className="text-sm font-medium text-ink-500 hover:text-brand-800">
        ← Food requests
      </Link>

      {created && (
        <Alert tone="success" title="Request posted">
          {proposal ? "We already found a match. Review it below." : "We’ll notify you as soon as suitable food is available."}
        </Alert>
      )}
      {updated && <Alert tone="success">Request updated.</Alert>}

      <section className="grain relative overflow-hidden rounded-[1.75rem] bg-brand-950 p-6 text-cream-50 sm:p-8">
        <div aria-hidden className="absolute -top-24 -right-16 size-72 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl leading-tight font-semibold">{title}</h1>
            <StageBadge stage={need.stage} />
          </div>
          <p className="mt-2 text-sm text-brand-200">
            {need.quantity} {UNIT_SHORT[need.unit]} for {need.people} people · {need.area} · needed by{" "}
            {formatDateTime(need.neededBy)}
          </p>
          <div className="mt-5 rounded-2xl bg-cream-50 p-4 text-ink-800">
            <NeedProgressBar progress={need.progress} />
          </div>
        </div>
      </section>

      {closedReason && <Alert tone="info">{closedReason}</Alert>}

      {proposal && (
        <Card className="border-sky-300">
          <CardHeader title="We found a match" description={STAGE_META.matched.description} />
          <CardBody className="space-y-4">
            <div className="flex items-start gap-4">
              <FoodIcon category={proposal.category} />
              <div className="min-w-0 text-sm">
                <Link href={`/ngo/donations/${proposal.donationId}`} className="font-semibold text-brand-950 hover:text-brand-700">
                  {proposal.foodType}
                </Link>
                <p className="text-ink-600">
                  {proposal.requestQuantity < proposal.quantity ? (
                    <>
                      <strong className="text-brand-950">
                        {proposal.requestQuantity} {UNIT_SHORT[proposal.unit]} for you (~{proposal.requestPeople} meals)
                      </strong>{" "}
                      of {proposal.quantity} {UNIT_SHORT[proposal.unit]}
                    </>
                  ) : (
                    <>
                      {proposal.quantity} {UNIT_SHORT[proposal.unit]} · ~{proposal.meals} meals
                    </>
                  )}{" "}
                  · from {proposal.donorName}
                  {proposal.donorArea ? `, ${proposal.donorArea}` : ""}
                  {proposal.distanceKm !== null && ` · ${formatDistance(proposal.distanceKm)} away`}
                </p>
                <p className="text-ink-500">
                  Ready {formatDateTime(proposal.pickupAt)} · best before {formatDateTime(proposal.expiresAt)} (
                  {formatRelative(proposal.expiresAt)})
                </p>
                <p className="mt-2 rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-800">
                  <span className="font-semibold">Why this match:</span>{" "}
                  {explainMatch(
                    { expiresAt: proposal.expiresAt, meals: proposal.requestPeople, distanceKm: proposal.distanceKm, sameArea: false },
                    need.progress.remaining,
                  )}
                  , expires {formatRelative(proposal.expiresAt)}.
                  {proposal.requestQuantity < proposal.quantity && " The rest stays available for other NGOs."}
                </p>
                <Link href={`/ngo/donations/${proposal.donationId}`} className="mt-1 inline-block font-semibold text-brand-700 hover:underline">
                  View full details →
                </Link>
              </div>
            </div>
            <MatchActions requestId={proposal.requestId} donationId={proposal.donationId} />
          </CardBody>
        </Card>
      )}

      <Card className="overflow-hidden">
        <CardHeader title="Food for this request" description="Accepted donations and their delivery progress." />
        {accepted.length ? (
          <ul className="divide-y divide-cream-200">
            {accepted.map((a) => {
              const stage = requestStage(a.status, a.donationStatus);
              const match = matchStage(a.status, a.allocatedAt, a.donationStatus);
              return (
                <li key={a.requestId}>
                  <Link href={`/ngo/donations/${a.donationId}`} className="flex items-center gap-4 px-6 py-4 hover:bg-cream-50">
                    <FoodIcon category={a.category} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-brand-950">{a.foodType}</p>
                        <MatchBadge stage={match} />
                        <StageBadge stage={stage} />
                      </div>
                      <p className="text-sm text-ink-500">
                        ~{a.meals} meals from {a.donorName} · {STATUS_META[a.donationStatus].label}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-6 py-8 text-center text-sm text-ink-500">
            {need.stage === "pending" ? "Nothing matched yet. We check again whenever new food is posted." : "No food was accepted for this request."}
          </p>
        )}
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="Matching history" description="Every donation proposed, accepted, rejected or allocated for this request." />
        <MatchHistory items={history} hrefFor={(donationId) => `/ngo/donations/${donationId}`} />
      </Card>

      <Card>
        <CardHeader title="Request details" />
        <CardBody>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <Detail label="Food type">{need.category ? CATEGORY_LABEL[need.category] : "Any food"}</Detail>
            <Detail label="Quantity">
              {need.quantity} {UNIT_SHORT[need.unit]}
            </Detail>
            <Detail label="People to serve">{need.people}</Detail>
            <Detail label="Needed by">{formatDateTime(need.neededBy)}</Detail>
            <Detail label="Service area">{need.area}</Detail>
            <Detail label="Delivery address">
              {need.address ?? "Your organisation’s address"}
              <span className="block text-ink-500">{need.lat !== null ? "📍 Pinned on the map" : "No map pin (your profile pin is used)"}</span>
            </Detail>
            {need.notes && (
              <Detail label="Notes" wide>
                {need.notes}
              </Detail>
            )}
            <Detail label="Posted" wide>
              {formatDateTime(need.createdAt)}
            </Detail>
          </dl>

          {(need.editable || canClose) && (
            <div className="mt-6 flex flex-col gap-2 border-t border-cream-200 pt-5 sm:flex-row">
              {need.editable && (
                <>
                  <Link
                    href={`/ngo/requests/${need.id}/edit`}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-brand-900/15 px-5 text-sm font-semibold text-brand-900 hover:bg-cream-100"
                  >
                    Edit request
                  </Link>
                  <form action={cancelNeedAction.bind(null, need.id)}>
                    <SubmitButton variant="ghost" block pendingLabel="Cancelling…" className="rounded-full text-red-600 hover:bg-red-50">
                      Cancel request
                    </SubmitButton>
                  </form>
                </>
              )}
              {canClose && (
                <form action={closeNeedAction.bind(null, need.id)}>
                  <SubmitButton variant="outline" block pendingLabel="Closing…" className="rounded-full">
                    We have enough — stop matching
                  </SubmitButton>
                </form>
              )}
            </div>
          )}
          {!need.editable && need.status === "OPEN" && (
            <p className="mt-4 text-xs text-ink-500">Food has been accepted for this request, so it can no longer be edited or cancelled.</p>
          )}
        </CardBody>
      </Card>
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
