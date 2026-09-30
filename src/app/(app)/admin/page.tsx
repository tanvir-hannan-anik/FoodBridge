import type { Metadata } from "next";
import Link from "next/link";
import { Table, Td } from "@/components/admin/admin-ui";
import { AttentionCard } from "@/components/admin/attention-card";
import { ActivityCard } from "@/components/dashboard/activity-card";
import { UserActions } from "@/components/admin/user-actions";
import { StatusBadge } from "@/components/donor/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Badge, Card, CardHeader, EmptyState } from "@/components/ui";
import { SafetyBadge } from "@/components/safety-badge";
import { getAttentionQueue } from "@/lib/admin/monitor";
import { getAdminStats, listUsers, recentActivity } from "@/lib/admin/service";
import { parsePeriod } from "@/lib/analytics/meta";
import { getActivity } from "@/lib/analytics/service";
import { getSafetyOverview } from "@/lib/safety/service";
import { requireRole } from "@/lib/auth/dal";
import { ROLE_LABEL } from "@/lib/auth/roles";
import { STATUS_META } from "@/lib/donations/meta";
import { cn, formatDateTime, formatNumber, formatRelative } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  const admin = await requireRole("admin");
  const { period } = await searchParams;
  const [stats, pending, activity, safety, trend, queue] = await Promise.all([
    getAdminStats(),
    listUsers({ status: "pending" }, 50),
    recentActivity(15),
    getSafetyOverview(),
    getActivity({ all: true }, parsePeriod(period)),
    getAttentionQueue(),
  ]);
  const verifiable = pending.filter((u) => u.role !== "donor");

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title={`Welcome, ${admin.name.split(" ")[0]}`}
        description="Verify partners, keep food moving and watch the platform’s health."
      />

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Total users"
          value={stats.users.total}
          href="/admin/users"
          hint={`${stats.users.donors} donors · ${stats.users.ngos} NGOs · ${stats.users.volunteers} volunteers`}
        />
        <Stat
          label="Active donations"
          value={stats.donations.active}
          href="/admin/donations"
          hint="Pending to delivered"
        />
        <Stat
          label="Pending requests"
          value={stats.pendingRequests}
          href="/admin/requests"
          hint="Food requests and matches waiting"
        />
        <Stat
          label="Completed deliveries"
          value={stats.donations.delivered}
          href="/admin/donations?status=COMPLETED"
          hint={`${stats.donations.completed} distributed by NGOs`}
        />
      </dl>

      <div className="mt-6">
        <AttentionCard queue={queue} />
      </div>

      <section aria-labelledby="impact" className="mt-6 rounded-[1.75rem] bg-brand-950 p-6 text-cream-50 sm:p-8">
        <h2 id="impact" className="text-xs font-semibold tracking-widest text-accent-300 uppercase">
          Impact
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Impact label="Meals served" value={stats.donations.meals} highlight />
          <Impact label="Meals delivered" value={stats.donations.mealsDelivered} />
          <Impact label="Donations posted" value={stats.donations.total} />
          <Impact label="Expired (food lost)" value={stats.donations.expired} hint={`${stats.donations.cancelled} cancelled`} />
        </dl>
        <p className="mt-5 text-sm text-brand-200">
          {stats.users.availableVolunteers} volunteers available now · {stats.users.suspended} suspended or deactivated accounts
        </p>
      </section>

      <div className="mt-6">
        <ActivityCard
          title="Platform activity"
          description={
            <>
              Food rescued and delivered over time.{" "}
              <Link href="/admin/reports" className="font-semibold text-brand-700 underline">
                Open reports
              </Link>
            </>
          }
          path="/admin"
          activity={trend}
          metric="meals"
          metricLabel="Meals delivered"
          totals={[
            { label: "Donations posted", value: trend.totals.posted },
            { label: "Deliveries", value: trend.totals.deliveries },
            { label: "Meals delivered", value: trend.totals.mealsDelivered, highlight: true },
            { label: "Expired", value: trend.totals.expired },
          ]}
        />
      </div>

      {(safety.expiring.length > 0 || safety.flagged.length > 0) && (
        <Card className="mt-6 overflow-hidden border-accent-500/40">
          <CardHeader
            title="Food safety"
            description="Food expiring within the hour, and donations paused for a safety check. Open one to act."
          />
          <ul className="divide-y divide-cream-200">
            {[...safety.flagged, ...safety.expiring].map((d) => (
              <li key={`${d.safetyFlag ?? "exp"}-${d.id}`}>
                <Link href={`/admin/donations/${d.id}`} className="flex flex-wrap items-center gap-3 px-6 py-3 text-sm hover:bg-cream-50">
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold text-brand-950">{d.foodType}</span>
                    <span className="text-ink-500"> · {d.donorName} · {STATUS_META[d.status].label}</span>
                    {d.safetyNote && <span className="block text-xs text-ink-500">{d.safetyNote}</span>}
                  </span>
                  <SafetyBadge expiresAt={d.expiresAt} safetyFlag={d.safetyFlag} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-5 lg:items-start">
        <Card className="overflow-hidden lg:col-span-3">
          <CardHeader
            title="Waiting for verification"
            description={verifiable.length ? `${verifiable.length} NGOs and volunteers to review` : "No one waiting"}
            action={
              <Link href="/admin/users?status=pending" className="text-sm font-semibold text-brand-700 hover:underline">
                All pending
              </Link>
            }
          />
          {verifiable.length ? (
            <Table head={["Account", "Area", "Registered", ""]}>
              {verifiable.map((u) => (
                <tr key={u.id}>
                  <Td>
                    <Link href={`/admin/users/${u.id}`} className="font-semibold text-brand-950 hover:text-brand-700">
                      {u.organizationName ?? u.name}
                    </Link>
                    <span className="block text-xs text-ink-500">
                      {ROLE_LABEL[u.role]} · {u.email}
                    </span>
                  </Td>
                  <Td className="text-ink-700">{u.area ?? "—"}</Td>
                  <Td className="whitespace-nowrap text-ink-600">{formatDateTime(u.createdAt)}</Td>
                  <Td>
                    <UserActions userId={u.id} role={u.role as "ngo" | "volunteer"} status={u.status} compact />
                  </Td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState title="All caught up" description="New NGO and volunteer sign-ups appear here for review." />
          )}
        </Card>

        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader
            title="Recent activity"
            description="Latest donation status changes."
            action={
              <Link href="/admin/activity" className="text-sm font-semibold text-brand-700 hover:underline">
                Activity log
              </Link>
            }
          />
          {activity.length ? (
            <ul className="divide-y divide-cream-200">
              {activity.map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-6 py-3">
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      a.status === "CANCELLED" || a.status === "EXPIRED" ? "bg-red-500" : "bg-brand-500",
                    )}
                  />
                  <div className="min-w-0 text-sm">
                    <p className="text-ink-800">
                      <Link href={`/admin/donations/${a.donationId}`} className="font-semibold text-brand-950 hover:text-brand-700">
                        {a.foodType}
                      </Link>{" "}
                      → {STATUS_META[a.status].label}
                    </p>
                    <p className="text-xs text-ink-500">
                      {formatRelative(a.createdAt)}
                      {a.actorName ? ` · ${a.actorName}${a.actorRole ? ` (${ROLE_LABEL[a.actorRole]})` : ""}` : " · System"}
                    </p>
                  </div>
                  <span className="ml-auto hidden shrink-0 sm:block">
                    <StatusBadge status={a.status} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No activity yet" />
          )}
        </Card>
      </div>

      {pending.length > verifiable.length && (
        <p className="mt-4 text-sm text-ink-500">
          <Badge tone="warning">{pending.length - verifiable.length}</Badge> other pending accounts.{" "}
          <Link href="/admin/users?status=pending" className="font-semibold text-brand-700 hover:underline">
            Review
          </Link>
        </p>
      )}
    </>
  );
}

function Stat({ label, value, hint, href }: { label: string; value: number; hint: string; href: string }) {
  return (
    <Link href={href} className="block rounded-card border border-cream-200 bg-white p-4 shadow-card hover:border-brand-500 sm:p-5">
      <div className="flex flex-col-reverse">
        <dt className="text-sm font-medium text-ink-600">
          {label}
          <span className="block text-xs font-normal text-ink-500">{hint}</span>
        </dt>
        <dd className="font-display text-3xl font-semibold text-brand-950 tabular-nums">{formatNumber(value)}</dd>
      </div>
    </Link>
  );
}

function Impact({ label, value, hint, highlight }: { label: string; value: number; hint?: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="text-sm text-brand-200">
        {label}
        {hint && <span className="block text-xs text-brand-300">{hint}</span>}
      </dt>
      <dd className={cn("font-display text-4xl font-semibold tabular-nums", highlight ? "text-accent-300" : "text-cream-50")}>
        {formatNumber(value)}
      </dd>
    </div>
  );
}
