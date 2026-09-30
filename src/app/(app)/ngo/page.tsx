import type { Metadata } from "next";
import Link from "next/link";
import { ActivityCard } from "@/components/dashboard/activity-card";
import { AvailableList } from "@/components/ngo/available-list";
import { RequestList } from "@/components/ngo/request-list";
import { Alert, Card, CardHeader, EmptyState } from "@/components/ui";
import { parsePeriod } from "@/lib/analytics/meta";
import { getActivity } from "@/lib/analytics/service";
import { requireRole } from "@/lib/auth/dal";
import { expireOverdueDonations } from "@/lib/donations/service";
import { matchOpenNeeds } from "@/lib/requests/service";
import { NGO_TYPE_LABEL } from "@/lib/ngo/meta";
import { getNgoStats, listAvailableDonations, listNgoRequests } from "@/lib/ngo/service";
import { formatNumber, greeting } from "@/lib/utils";

export const metadata: Metadata = { title: "NGO dashboard" };

export default async function NgoDashboard({ searchParams }: PageProps<"/ngo">) {
  const ngo = await requireRole("ngo");
  await expireOverdueDonations();
  const verified = ngo.status === "active";
  if (verified) await matchOpenNeeds({ ngoId: ngo.id });

  const { welcome, period } = await searchParams;
  const [stats, nearby, requests, activity] = await Promise.all([
    getNgoStats(ngo.id),
    // Prefer food in the NGO's own service area; fall back to everything available.
    listAvailableDonations(ngo.id, { location: ngo.area ?? undefined }, 3),
    listNgoRequests(ngo.id),
    getActivity({ ngoId: ngo.id }, parsePeriod(period)),
  ]);
  const available = nearby.length ? nearby : await listAvailableDonations(ngo.id, {}, 3);
  const active = requests.filter((r) => ["pending", "matched", "accepted", "delivered"].includes(r.stage)).slice(0, 5);
  const orgName = ngo.organizationName ?? ngo.name;

  return (
    <div className="space-y-6">
      {!verified && (
        <Alert
          tone="warning"
          title={welcome ? "Thanks for registering! Your NGO is under review" : "Your NGO is under review"}
        >
          Our team verifies every NGO before it can request food, usually within one working day. Meanwhile you can
          browse donations and{" "}
          <Link href="/profile" className="font-semibold underline">
            complete your profile
          </Link>
          .
        </Alert>
      )}

      {/* Welcome banner */}
      <section className="grain relative overflow-hidden rounded-[1.75rem] bg-brand-950 text-cream-50">
        <div aria-hidden className="absolute -top-24 -right-16 size-80 rounded-full bg-brand-600/35 blur-3xl" />
        <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-semibold tracking-widest text-accent-300 uppercase">
              {ngo.ngoType ? NGO_TYPE_LABEL[ngo.ngoType].split(" /")[0] : "NGO"} dashboard
              {verified && (
                <span className="ml-2 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] tracking-wider text-white">
                  ✓ Verified
                </span>
              )}
            </p>
            <h1 className="mt-3 font-display text-3xl leading-tight font-semibold sm:text-[2.6rem]">
              {greeting()}, {orgName}
            </h1>
            <p className="mt-2 max-w-lg text-brand-200">
              {ngo.area ? `Serving ${ngo.area}. ` : ""}Find surplus food nearby and get it to the people you serve.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/ngo/donations"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent-400 px-6 font-semibold text-brand-950 hover:bg-accent-300"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  className="size-5"
                >
                  <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-3.5-3.5" strokeLinecap="round" />
                </svg>
                Find food
              </Link>
              <Link
                href={verified ? "/ngo/requests/new" : "/ngo/requests"}
                className="inline-flex h-12 items-center justify-center rounded-full border border-cream-50/25 px-6 font-semibold text-cream-50 hover:bg-cream-50/10"
              >
                {verified ? "Post a food request" : "My requests"}
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-cream-50/10 bg-cream-50/5 p-6 lg:w-72">
            <p className="text-sm text-brand-200">Meals distributed</p>
            <p className="mt-1 font-display text-6xl font-semibold text-accent-300 tabular-nums">
              {formatNumber(stats.meals)}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-brand-300">From donations you marked as distributed.</p>
          </div>
        </div>
      </section>

      <dl className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Available donations"
          value={stats.available}
          hint="Open for requests right now"
          tone="bg-accent-100 text-accent-700"
          icon="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-3.5-3.5"
        />
        <Stat
          label="Active requests"
          value={stats.activeRequests}
          hint={`Pending, matched or on the way · ${stats.openNeeds} open food request${stats.openNeeds === 1 ? "" : "s"}`}
          tone="bg-sky-50 text-sky-700"
          icon="M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
        <Stat
          label="Received donations"
          value={stats.received}
          hint="Delivered to your organisation"
          tone="bg-brand-100 text-brand-700"
          icon="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"
        />
      </dl>

      <ActivityCard
        title="Food received over time"
        description={
          <>
            Counted when food is delivered to you.{" "}
            <Link href="/ngo/reports" className="font-semibold text-brand-700 underline">
              See your report
            </Link>
          </>
        }
        path="/ngo"
        activity={activity}
        metric="meals"
        metricLabel="Meals received"
        totals={[
          { label: "Deliveries received", value: activity.totals.deliveries },
          { label: "Meals received", value: activity.totals.mealsDelivered, highlight: true },
          { label: "Meals served (all time)", value: stats.meals },
        ]}
      />

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-brand-950">
              {nearby.length && ngo.area ? `Available near ${ngo.area}` : "Available now"}
            </h2>
            <p className="text-sm text-ink-500">Soonest-expiring first.</p>
          </div>
          <Link
            href="/ngo/donations"
            className="shrink-0 rounded-full border border-brand-900/10 bg-white px-3.5 py-1.5 text-sm font-semibold text-brand-800 hover:bg-cream-100"
          >
            See all
          </Link>
        </div>
        {available.length ? (
          <AvailableList items={available} />
        ) : (
          <Card>
            <EmptyState
              title="No food available right now"
              description="New donations appear here as soon as donors post them."
            />
          </Card>
        )}
      </section>

      <Card className="overflow-hidden">
        <CardHeader
          title="Active requests"
          description="Track each request from match to delivery."
          action={
            <Link
              href="/ngo/requests"
              className="rounded-full border border-brand-900/10 px-3.5 py-1.5 text-sm font-semibold text-brand-800 hover:bg-cream-100"
            >
              View all
            </Link>
          }
        />
        {active.length ? (
          <RequestList items={active} />
        ) : (
          <p className="px-6 py-10 text-center text-sm text-ink-500">
            No active requests. Browse available food and request what you can serve.
          </p>
        )}
      </Card>
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
  value: number;
  hint: string;
  tone: string;
  icon: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-5 sm:p-6">
      <span aria-hidden className={`grid size-12 shrink-0 place-items-center rounded-2xl ${tone}`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-6"
        >
          <path d={icon} />
        </svg>
      </span>
      <div className="flex flex-col-reverse">
        <dt className="text-sm font-medium text-ink-600">
          {label}
          <span className="block text-xs font-normal text-ink-500">{hint}</span>
        </dt>
        <dd className="font-display text-3xl font-semibold text-brand-950 tabular-nums">{formatNumber(value)}</dd>
      </div>
    </Card>
  );
}
