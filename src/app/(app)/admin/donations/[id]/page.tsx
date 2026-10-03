import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  acceptMatchAsAdmin,
  cancelDonationAsAdmin,
  clearSafetyFlagAsAdmin,
  completeAsAdmin,
  confirmDeliveryAsAdmin,
  disableDonationAsAdmin,
  flagDonationAsAdmin,
  cancelMatchAsAdmin,
  cancelRequestAsAdmin,
  editDonation,
  offerToVolunteerAsAdmin,
  rejectMatchAsAdmin,
  releaseVolunteer,
} from "@/app/actions/admin";
import { Table, Td } from "@/components/admin/admin-ui";
import { DonationEditForm } from "@/components/admin/donation-edit-form";
import { ConfirmDeliveryForm, OfferVolunteerForm } from "@/components/admin/resolve-forms";
import { DeliveryProgress, deliveryHeadline } from "@/components/delivery/delivery-status";
import { DeliveryMap } from "@/components/map/delivery-map";
import { MatchBadge, MatchHistory } from "@/components/requests/match-status";
import { SafetyBadge } from "@/components/safety-badge";
import { StatusBadge } from "@/components/donor/status-badge";
import { DonationTimeline } from "@/components/donor/timeline";
import { CompleteForm } from "@/components/ngo/complete-form";
import { Badge, Card, CardBody, CardHeader, SubmitButton } from "@/components/ui";
import { ADMIN_ACTION_LABEL, REQUEST_STATUS_META } from "@/lib/admin/meta";
import { getAdminDonation, listVolunteerChoices } from "@/lib/admin/service";
import { listTaskOffers } from "@/lib/dispatch/service";
import { formatDistance } from "@/lib/geo";
import { getDeliveryView } from "@/lib/location/service";
import { matchStage, UNMATCHABLE } from "@/lib/matching/meta";
import { listMatchHistory } from "@/lib/matching/service";
import { OFFER_STATUS_LABEL } from "@/lib/volunteer/meta";
import { requireRole } from "@/lib/auth/dal";
import { ROLE_LABEL } from "@/lib/auth/roles";
import { CANCELLABLE, CATEGORY_LABEL, CONDITION_LABEL, STATUS_META, UNIT_SHORT } from "@/lib/donations/meta";
import { getI18n } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Donation") };
}

export default async function AdminDonationPage({ params }: PageProps<"/admin/donations/[id]">) {
  const admin = await requireRole("admin");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const d = await getAdminDonation(id);
  if (!d) notFound();
  const needsVolunteer = d.status === "MATCHED" && !d.volunteer;
  const [view, history, offers, volunteers] = await Promise.all([
    d.ngo ? getDeliveryView(admin, d.id) : Promise.resolve(null),
    listMatchHistory({ donationId: d.id }, 50),
    listTaskOffers(d.id),
    needsVolunteer ? listVolunteerChoices(d.id) : Promise.resolve([]),
  ]);

  const editable = ["PENDING", "MATCHED", "ASSIGNED"].includes(d.status);
  const cancellable = CANCELLABLE.includes(d.status);
  const live = !["COMPLETED", "CANCELLED", "EXPIRED"].includes(d.status);
  const onTheWay = d.status === "PICKED_UP" || d.status === "IN_TRANSIT";
  const { t, dateTime, relative, number } = await getI18n();

  return (
    <div className="space-y-6">
      <Link href="/admin/donations" className="text-sm font-medium text-ink-500 hover:text-brand-800">
        ← {t("Donations")}
      </Link>

      <Card>
        <CardBody className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-semibold text-brand-950">{d.foodType}</h1>
              <StatusBadge status={d.status} />
              <SafetyBadge expiresAt={d.expiresAt} safetyFlag={d.safetyFlag} />
            </div>
            <p className="mt-1 text-sm text-ink-600">
              {number(d.quantity)} {t(UNIT_SHORT[d.unit])} · {t("~{n} meals", { n: d.mealsEstimate })} · {t(CATEGORY_LABEL[d.category])} ·{" "}
              {t(CONDITION_LABEL[d.condition]).split(" — ")[0]}
            </p>
            <p className="text-sm text-ink-500">
              {t("Best before")} {dateTime(d.expiresAt)}
              {live && ` (${relative(d.expiresAt)})`} · {t("posted {time}", { time: dateTime(d.createdAt) })}
            </p>
            {d.cancelReason && <p className="mt-1 text-sm text-red-700">{t("Cancelled: {reason}", { reason: d.cancelReason })}</p>}
            {d.parentId && (
              <p className="mt-1 text-sm text-ink-600">
                {t("Remainder of a partly allocated donation")} ·{" "}
                <Link href={`/admin/donations/${d.parentId}`} className="font-semibold text-brand-700 hover:underline">
                  {t("see the original")}
                </Link>
              </p>
            )}
          </div>
          <p className="text-xs text-ink-500">ID {d.id}</p>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <Party title="Donor" href={`/admin/users/${d.donor.id}`} name={d.donor.org ?? d.donor.name} lines={[d.donor.phone, d.donor.area]} />
            <Party
              title="NGO"
              href={d.ngo ? `/admin/users/${d.ngo.id}` : undefined}
              name={d.ngo ? (d.ngo.org ?? d.ngo.name) : t("Not matched yet")}
              lines={d.ngo ? [d.ngo.phone, d.ngo.area] : []}
            />
            <Party
              title="Volunteer"
              href={d.volunteer ? `/admin/users/${d.volunteer.id}` : undefined}
              name={d.volunteer?.name ?? t("Not assigned")}
              lines={d.volunteer ? [d.volunteer.phone] : []}
            />
          </div>

          {view && (
            <Card>
              <CardHeader title="Delivery" description={t(deliveryHeadline(d.status, view.pendingOffer, d.volunteer?.name))} />
              <CardBody className="space-y-5">
                {live && <DeliveryProgress status={d.status} pendingOffer={view.pendingOffer} />}
                <DeliveryMap initial={view} />
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Status timeline" description={STATUS_META[d.status].description} />
            <CardBody>
              <DonationTimeline status={d.status} events={d.events} />
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Activity history" description="Every status change, who made it and when." />
            <Table head={["When", "Status", "By", "Note"]}>
              {d.events.map((e, i) => (
                <tr key={i}>
                  <Td className="whitespace-nowrap text-ink-600">{dateTime(e.createdAt)}</Td>
                  <Td>
                    <StatusBadge status={e.status} />
                  </Td>
                  <Td className="text-ink-700">
                    {e.actorName ?? t("System")}
                    {e.actorRole && <span className="block text-xs text-ink-500">{t(ROLE_LABEL[e.actorRole])}</span>}
                  </Td>
                  <Td className="text-ink-600">{e.note ? t(e.note) : "—"}</Td>
                </tr>
              ))}
              {d.log.map((l) => (
                <tr key={l.id} className="bg-cream-50/60">
                  <Td className="whitespace-nowrap text-ink-600">{dateTime(l.createdAt)}</Td>
                  <Td>
                    <Badge>Admin</Badge>
                  </Td>
                  <Td className="text-ink-700">{l.actorName ?? t("Admin")}</Td>
                  <Td className="text-ink-600">
                    {t(ADMIN_ACTION_LABEL[l.action] ?? l.action)}
                    {l.note ? ` · ${l.note}` : ""}
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="NGO requests & matches" description="Direct requests and system matches. Accept, reject or cancel on an NGO’s behalf." />
            {d.requests.length ? (
              <Table head={["NGO", "Status", "For", "When", ""]}>
                {d.requests.map((r) => (
                  <tr key={r.id}>
                    <Td>
                      <Link href={`/admin/users/${r.ngoId}`} className="font-medium text-brand-950 hover:text-brand-700">
                        {r.ngoName}
                      </Link>
                      <span className="block text-xs text-ink-500">{t(r.needId ? "Matched to a food request" : "Direct request")}</span>
                    </Td>
                    <Td>
                      <MatchBadge stage={matchStage(r.status, r.allocatedAt, d.status)} />
                      <span className="mt-1 block text-xs text-ink-500">{t(REQUEST_STATUS_META[r.status].label)}</span>
                    </Td>
                    <Td className="text-ink-700">
                      {number(r.quantity)} {t(UNIT_SHORT[d.unit])} · {t("{n} people", { n: r.people })}
                      {r.distanceKm !== null && (
                        <span className="block text-xs text-ink-500">{t("{d} away", { d: t(formatDistance(r.distanceKm) ?? "") })}</span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap text-ink-600">{dateTime(r.createdAt)}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-2">
                        {r.status === "MATCHED" && (
                          <>
                            <form action={acceptMatchAsAdmin.bind(null, r.id)}>
                              <SubmitButton size="sm" className="rounded-full px-3" pendingLabel="Accepting…">
                                Accept for NGO
                              </SubmitButton>
                            </form>
                            <form action={rejectMatchAsAdmin.bind(null, r.id)}>
                              <SubmitButton size="sm" variant="outline" className="rounded-full px-3">
                                Reject
                              </SubmitButton>
                            </form>
                          </>
                        )}
                        {r.status === "PENDING" && (
                          <form action={cancelRequestAsAdmin.bind(null, r.id)}>
                            <SubmitButton size="sm" variant="outline" className="rounded-full px-3">
                              Withdraw
                            </SubmitButton>
                          </form>
                        )}
                        {r.status === "ACCEPTED" && d.ngo?.id === r.ngoId && UNMATCHABLE.includes(d.status) && (
                          <form action={cancelMatchAsAdmin.bind(null, r.id)}>
                            <SubmitButton size="sm" variant="outline" className="rounded-full px-3 text-red-700" pendingLabel="Cancelling…">
                              Cancel match
                            </SubmitButton>
                          </form>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </Table>
            ) : (
              <p className="px-6 py-8 text-center text-sm text-ink-500">{t("No NGO has requested this donation.")}</p>
            )}
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Matching history" description="Which NGO this food (and any part split from it) was proposed and allocated to." />
            <MatchHistory items={history} showNgo hrefFor={(donationId) => `/admin/donations/${donationId}`} />
          </Card>

          {offers.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader title="Volunteer assignment" description="Who the pickup was offered to, nearest first, and their answers." />
              <Table head={["Volunteer", "Distance", "Offered", "Answer"]}>
                {offers.map((o) => (
                  <tr key={o.id}>
                    <Td>
                      <Link href={`/admin/users/${o.volunteerId}`} className="font-medium text-brand-950 hover:text-brand-700">
                        {o.volunteerName}
                      </Link>
                    </Td>
                    <Td className="text-ink-600">{t(formatDistance(o.distanceKm) ?? "—")}</Td>
                    <Td className="whitespace-nowrap text-ink-600">{dateTime(o.createdAt)}</Td>
                    <Td className="text-ink-700">
                      {t(OFFER_STATUS_LABEL[o.status])}
                      {o.respondedAt && <span className="block text-xs text-ink-500">{dateTime(o.respondedAt)}</span>}
                      {o.note && <span className="block text-xs text-ink-500">{t(o.note)}</span>}
                    </Td>
                  </tr>
                ))}
              </Table>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className={d.safetyFlag ? "border-red-300" : undefined}>
            <CardHeader title="Food safety" description="Pause food with incomplete or doubtful safety details, or withdraw it." />
            <CardBody className="space-y-4">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Detail label="Prepared">{dateTime(d.preparedAt)}</Detail>
                <Detail label="Best before">{dateTime(d.expiresAt)}</Detail>
                <Detail label="Condition">{t(CONDITION_LABEL[d.condition]).split(" — ")[0]}</Detail>
                <Detail label="Food type">{t(CATEGORY_LABEL[d.category])}</Detail>
              </dl>
              {d.safetyNote && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{t("Note: {note}", { note: d.safetyNote })}</p>
              )}
              {d.status === "PENDING" && !d.safetyFlag && (
                <form action={flagDonationAsAdmin.bind(null, d.id)} className="space-y-2">
                  <label className="block text-sm font-semibold text-brand-950">
                    {t("What needs checking?")} <span className="font-normal text-ink-500">{t("(sent to the donor)")}</span>
                    <input
                      name="reason"
                      maxLength={200}
                      placeholder={t("e.g. No prepared time for cooked rice")}
                      className="mt-1.5 block h-11 w-full rounded-field border border-cream-300 px-3 text-sm font-normal focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/25"
                    />
                  </label>
                  <SubmitButton variant="outline" block className="rounded-full">
                    Pause for safety check
                  </SubmitButton>
                </form>
              )}
              {d.safetyFlag === "FLAGGED" && (
                <form action={clearSafetyFlagAsAdmin.bind(null, d.id)}>
                  <SubmitButton variant="outline" block className="rounded-full">
                    Checked: make it available again
                  </SubmitButton>
                </form>
              )}
              {cancellable && (
                <form action={disableDonationAsAdmin.bind(null, d.id)} className="space-y-2">
                  <input
                    name="reason"
                    maxLength={200}
                    aria-label={t("Why it’s unsafe")}
                    placeholder={t("Why it’s unsafe (sent to everyone involved)")}
                    className="block h-11 w-full rounded-field border border-cream-300 px-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/25"
                  />
                  <SubmitButton variant="danger" block className="rounded-full">
                    Withdraw as unsafe
                  </SubmitButton>
                </form>
              )}
            </CardBody>
          </Card>

          {(cancellable || d.status === "ASSIGNED" || onTheWay || d.status === "DELIVERED") && (
            <Card>
              <CardHeader title="Control" description="Step in when something is stuck. Every action is written to the activity log." />
              <CardBody className="space-y-5">
                {needsVolunteer && (
                  <section aria-labelledby="offer-title" className="space-y-2">
                    <h3 id="offer-title" className="text-sm font-semibold text-brand-950">
                      {t("Offer to a volunteer")}
                    </h3>
                    <p className="text-sm text-ink-600">{t("No volunteer has taken this pickup yet. Pick someone you’ve spoken to.")}</p>
                    <OfferVolunteerForm action={offerToVolunteerAsAdmin.bind(null, d.id)} volunteers={volunteers} />
                  </section>
                )}
                {onTheWay && (
                  <section aria-labelledby="deliver-title" className="space-y-2">
                    <h3 id="deliver-title" className="text-sm font-semibold text-brand-950">
                      {t("Record the delivery")}
                    </h3>
                    <p className="text-sm text-ink-600">{t("Use this when the food arrived but nobody confirmed it in the app.")}</p>
                    <ConfirmDeliveryForm action={confirmDeliveryAsAdmin.bind(null, d.id)} />
                  </section>
                )}
                {d.status === "DELIVERED" && (
                  <section aria-labelledby="complete-title" className="space-y-2">
                    <h3 id="complete-title" className="text-sm font-semibold text-brand-950">
                      {t("Record meals served")}
                    </h3>
                    <p className="text-sm text-ink-600">
                      {t("For when {ngo} has told you how many people ate.", { ngo: d.ngo ? (d.ngo.org ?? d.ngo.name) : t("the NGO") })}
                    </p>
                    <CompleteForm action={completeAsAdmin.bind(null, d.id)} defaultMeals={d.mealsEstimate} />
                  </section>
                )}
                {d.status === "ASSIGNED" && (
                  <form action={releaseVolunteer.bind(null, d.id)} className="space-y-2">
                    <p className="text-sm text-ink-600">
                      {t("Take the task away from {name} and offer it to others.", { name: d.volunteer?.name ?? t("the volunteer") })}
                    </p>
                    <SubmitButton variant="outline" block className="rounded-full">
                      Release volunteer
                    </SubmitButton>
                  </form>
                )}
                {cancellable && (
                  <form action={cancelDonationAsAdmin.bind(null, d.id)} className="space-y-2">
                    <label className="block text-sm font-semibold text-brand-950">
                      {t("Cancel reason")} <span className="font-normal text-ink-500">{t("(sent to donor, NGO and volunteer)")}</span>
                      <input
                        name="reason"
                        maxLength={200}
                        className="mt-1.5 block h-11 w-full rounded-field border border-cream-300 px-3 text-sm font-normal focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/25"
                      />
                    </label>
                    <SubmitButton variant="danger" block className="rounded-full">
                      Cancel donation
                    </SubmitButton>
                  </form>
                )}
              </CardBody>
            </Card>
          )}

          {editable ? (
            <Card>
              <CardHeader title="Update details" description="Corrections only. Status changes follow the workflow." />
              <CardBody>
                <DonationEditForm
                  action={editDonation.bind(null, d.id)}
                  values={{
                    foodType: d.foodType,
                    quantity: d.quantity,
                    unit: d.unit,
                    pickupAt: d.pickupAt.toISOString(),
                    expiresAt: d.expiresAt.toISOString(),
                    pickupAddress: d.pickupAddress,
                    contactName: d.contactName,
                    contactPhone: d.contactPhone,
                    instructions: d.instructions,
                  }}
                />
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardHeader title="Pickup" />
              <CardBody>
                <dl className="space-y-3">
                  <Detail label="Address">{d.pickupAddress}</Detail>
                  <Detail label="Contact">
                    {d.contactName} · {d.contactPhone}
                  </Detail>
                  <Detail label="Ready">{dateTime(d.pickupAt)}</Detail>
                  {d.instructions && <Detail label="Instructions">{d.instructions}</Detail>}
                  {d.mealsServed && <Detail label="Meals served">{number(d.mealsServed)}</Detail>}
                </dl>
              </CardBody>
            </Card>
          )}

          {d.hasImage && (
            // eslint-disable-next-line @next/next/no-img-element -- private, auth-checked image route
            <img
              src={`/admin/donations/${d.id}/image`}
              alt={t("Photo of {food}", { food: d.foodType })}
              loading="lazy"
              className="w-full rounded-card border border-cream-200 object-cover"
            />
          )}
        </div>
      </div>
    </div>
  );
}

async function Party({ title, name, lines, href }: { title: string; name: string; lines: (string | null)[]; href?: string }) {
  const { t } = await getI18n();
  return (
    <Card>
      <CardBody className="p-5">
        <p className="text-xs font-semibold tracking-widest text-ink-500 uppercase">{t(title)}</p>
        {href ? (
          <Link href={href} className="mt-1 block font-semibold text-brand-950 hover:text-brand-700">
            {name}
          </Link>
        ) : (
          <p className="mt-1 text-ink-500">{name}</p>
        )}
        {lines.filter(Boolean).map((l) => (
          <p key={l} className="text-sm text-ink-600">
            {l}
          </p>
        ))}
      </CardBody>
    </Card>
  );
}

async function Detail({ label, children }: { label: string; children: ReactNode }) {
  const { t } = await getI18n();
  return (
    <div>
      <dt className="text-xs font-semibold tracking-widest text-ink-500 uppercase">{t(label)}</dt>
      <dd className="mt-1 text-sm text-brand-950">{children}</dd>
    </div>
  );
}
