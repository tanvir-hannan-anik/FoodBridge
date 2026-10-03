import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ActivityCard } from "@/components/dashboard/activity-card";
import { DonationList } from "@/components/donor/donation-list";
import { Alert, Card, CardHeader, EmptyState } from "@/components/ui";
import { parsePeriod } from "@/lib/analytics/meta";
import { getActivity } from "@/lib/analytics/service";
import { requireRole } from "@/lib/auth/dal";
import { DONOR_TYPE_LABEL } from "@/lib/donations/meta";
import { getDonorStats, listDonorDonations, sweepDonorDonations } from "@/lib/donations/service";
import { getI18n } from "@/lib/i18n-server";
import { expiresWithin, greeting } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Donor dashboard") };
}

const SAFETY = [
  "Food is cooked or packed today and stored covered",
  "Hot food kept hot, cold food kept cold",
  "No food that’s been served on plates or half-eaten",
  "Allergens (nuts, dairy…) noted in instructions",
];

export default async function DonorDashboard({ searchParams }: PageProps<"/donor">) {
  const donor = await requireRole("donor");
  await sweepDonorDonations(donor.id);
  const { welcome, period } = await searchParams;
  const [stats, active, completed, activity] = await Promise.all([
    getDonorStats(donor.id),
    listDonorDonations(donor.id, "active", 6),
    listDonorDonations(donor.id, "completed", 4),
    getActivity({ donorId: donor.id }, parsePeriod(period)),
  ]);

  const expiringSoon = active.filter((d) => expiresWithin(d.expiresAt, 60));
  const awaiting = active.filter((d) => d.status === "PENDING" && d.pendingRequests > 0);
  const firstName = donor.name.split(" ")[0];
  const { t, number } = await getI18n();

  return (
    <div className="space-y-6">
      {welcome && (
        <Alert tone="success" title={t("Welcome to FoodBridge — your donor account is ready")}>
          {t("Post your first donation below. It takes about a minute.")}
        </Alert>
      )}

      {/* Welcome banner */}
      <section className="grain relative overflow-hidden rounded-[1.75rem] bg-brand-950 text-cream-50">
        <div aria-hidden className="absolute -top-24 -right-16 size-80 rounded-full bg-brand-600/35 blur-3xl" />
        <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-semibold tracking-widest text-accent-300 uppercase">
              {t("{type} dashboard", {
                type: t(donor.donorType ? DONOR_TYPE_LABEL[donor.donorType].split(" (")[0] : "Donor"),
              })}
            </p>
            <h1 className="mt-3 font-display text-3xl leading-tight font-semibold sm:text-[2.6rem]">
              {t("{greeting}, {name}", { greeting: t(greeting()), name: firstName })}
            </h1>
            <p className="mt-2 max-w-lg text-brand-200">
              {donor.organizationName ? `${donor.organizationName} · ` : ""}
              {t("Thank you for sharing food with your community.")}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/donor/donate"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent-400 px-6 font-semibold text-brand-950 hover:bg-accent-300"
              >
                <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-5">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                {t("Donate food")}
              </Link>
              <Link
                href="/donor/donations"
                className="inline-flex h-12 items-center justify-center rounded-full border border-cream-50/25 px-6 font-semibold text-cream-50 hover:bg-cream-50/10"
              >
                {t("View my donations")}
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-cream-50/10 bg-cream-50/5 p-6 lg:w-72">
            <p className="text-sm text-brand-200">{t("Meals saved")}</p>
            <p className="mt-1 font-display text-6xl font-semibold text-accent-300 tabular-nums">
              {number(stats.meals)}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-brand-300">
              {t("Counted from completed donations. About 400 g of food is one meal.")}
            </p>
          </div>
        </div>
      </section>

      {awaiting.length > 0 && (
        <Alert tone="info" title={t("NGOs are asking for your food")}>
          {awaiting.length === 1 ? (
            <>
              {t(
                awaiting[0].pendingRequests === 1
                  ? "{n} request is waiting for you to accept:"
                  : "{n} requests are waiting for you to accept:",
                { n: awaiting[0].pendingRequests },
              )}{" "}
              <Link href={`/donor/donations/${awaiting[0].id}`} className="font-semibold underline">
                “{awaiting[0].foodType}”
              </Link>
            </>
          ) : (
            t("{n} donations have NGO requests waiting for you to accept.", { n: awaiting.length })
          )}
        </Alert>
      )}

      {expiringSoon.length > 0 && (
        <Alert tone="warning" title={t("Expiring soon")}>
          {expiringSoon.length === 1
            ? t("“{food}” expires within an hour and hasn’t been picked up yet.", { food: expiringSoon[0].foodType })
            : t("{n} donations expire within an hour and haven’t been picked up yet.", { n: expiringSoon.length })}
        </Alert>
      )}

      {/* Stats */}
      <dl className="grid gap-4 sm:grid-cols-3">
        <Stat
          label={t("Active donations")}
          value={number(stats.active)}
          hint={t("Waiting for pickup or on the way")}
          tone="bg-accent-100 text-accent-700"
          icon="M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
        <Stat
          label={t("Completed")}
          value={number(stats.completed)}
          hint={t("Delivered and served")}
          tone="bg-brand-100 text-brand-700"
          icon="m5 12.5 4.5 4.5L19 7.5"
        />
        <Stat
          label={t("Total posted")}
          value={number(stats.total)}
          hint={t("All donations you’ve shared")}
          tone="bg-cream-200 text-brand-900"
          icon="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5ZM3 7.5 12 12l9-4.5M12 12v9"
        />
      </dl>

      <ActivityCard
        title="Your impact over time"
        description="Meals are counted when your food reaches an NGO."
        path="/donor"
        activity={activity}
        metric="meals"
        metricLabel="Meals delivered from your food"
        totals={[
          { label: "Donations posted", value: activity.totals.posted },
          { label: "Delivered", value: activity.totals.deliveries },
          { label: "Meals rescued", value: activity.totals.mealsDelivered, highlight: true },
          { label: "Expired", value: activity.totals.expired },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader
            title="Active donations"
            description="Tap a donation to see its live status."
            action={
              active.length > 0 && (
                <Link
                  href="/donor/donations?filter=active"
                  className="rounded-full border border-brand-900/10 px-3.5 py-1.5 text-sm font-semibold text-brand-800 hover:bg-cream-100"
                >
                  {t("View all")}
                </Link>
              )
            }
          />
          {active.length ? (
            <DonationList items={active} />
          ) : (
            <EmptyState
              title="No active donations"
              description="When you have extra food, post it here and a nearby NGO will pick it up."
              action={
                <Link
                  href="/donor/donate"
                  className="inline-flex h-11 items-center rounded-full bg-brand-600 px-6 text-sm font-semibold text-white shadow-glow hover:bg-brand-700"
                >
                  {t("Donate food")}
                </Link>
              }
            />
          )}
        </Card>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader title="Recently completed" />
            {completed.length ? (
              <DonationList items={completed} compact />
            ) : (
              <p className="px-6 py-10 text-center text-sm text-ink-500">{t("Completed donations will appear here.")}</p>
            )}
          </Card>

          <section className="rounded-card border border-accent-100 bg-accent-50 p-6">
            <h2 className="font-display text-xl font-semibold text-brand-950">{t("Before you donate")}</h2>
            <p className="mt-1 text-sm text-ink-600">{t("A quick food-safety check keeps everyone safe.")}</p>
            <ul className="mt-4 space-y-3">
              {SAFETY.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-ink-700">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
                    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-3">
                      <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {t(item)}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  tone: string;
  icon: string;
}): ReactNode {
  return (
    <Card className="flex items-center gap-4 p-5 sm:p-6">
      <span aria-hidden className={`grid size-12 shrink-0 place-items-center rounded-2xl ${tone}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6">
          <path d={icon} />
        </svg>
      </span>
      <div className="flex flex-col-reverse">
        <dt className="text-sm font-medium text-ink-600">
          {label}
          <span className="block text-xs font-normal text-ink-500">{hint}</span>
        </dt>
        <dd className="font-display text-3xl font-semibold text-brand-950 tabular-nums">{value}</dd>
      </div>
    </Card>
  );
}
