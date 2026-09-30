import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { RequestList } from "@/components/ngo/request-list";
import { NeedList } from "@/components/requests/need-list";
import { Alert, Card, CardHeader, EmptyState } from "@/components/ui";
import { requireRole } from "@/lib/auth/dal";
import { UNIT_SHORT } from "@/lib/donations/meta";
import { STAGE_META, STAGES, type Stage } from "@/lib/ngo/meta";
import { listDistributions, listNgoRequests } from "@/lib/ngo/service";
import { listNeeds, matchOpenNeeds } from "@/lib/requests/service";
import { cn, formatDateTime, formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Food requests" };

export default async function NgoRequestsPage({ searchParams }: PageProps<"/ngo/requests">) {
  const ngo = await requireRole("ngo");
  const { stage: raw } = await searchParams;
  const stage = STAGES.includes(raw as Stage) ? (raw as Stage) : "all";
  const verified = ngo.status === "active";

  if (verified) await matchOpenNeeds({ ngoId: ngo.id });
  const [needs, requests, distributions] = await Promise.all([
    listNeeds(ngo.id),
    listNgoRequests(ngo.id),
    listDistributions(ngo.id),
  ]);
  const direct = requests.filter((r) => !r.needId && r.status !== "SKIPPED");
  const counts = Object.fromEntries(STAGES.map((s) => [s, needs.filter((n) => n.stage === s).length])) as Record<Stage, number>;
  const shown = stage === "all" ? needs : needs.filter((n) => n.stage === stage);
  const open = needs.filter((n) => n.stage !== "cancelled");
  const totals = open.reduce(
    (t, n) => ({
      requested: t.requested + n.progress.requested,
      matched: t.matched + n.progress.matched,
      delivered: t.delivered + n.progress.delivered,
      remaining: t.remaining + n.progress.remaining,
    }),
    { requested: 0, matched: 0, delivered: 0, remaining: 0 },
  );

  const tabs: { value: Stage | "all"; label: string; count: number }[] = [
    { value: "all", label: "All", count: needs.length },
    ...STAGES.map((s) => ({ value: s, label: STAGE_META[s].label, count: counts[s] })),
  ];

  return (
    <>
      <PageHeader
        eyebrow="Requests"
        title="Food requests"
        description="Tell us what you need. We match available food to it, and you confirm."
        action={
          verified && (
            <div className="flex gap-2">
              <Link
                href="/ngo/donations"
                className="inline-flex h-12 items-center justify-center rounded-full border border-brand-900/15 bg-white px-5 font-semibold text-brand-900 hover:bg-cream-100"
              >
                Find food
              </Link>
              <Link
                href="/ngo/requests/new"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 font-semibold text-white shadow-glow hover:bg-brand-700"
              >
                New request
              </Link>
            </div>
          )
        }
      />

      {!verified && (
        <Alert tone="warning" title="Verification pending" className="mb-6">
          You can post food requests once our team has verified your NGO.
        </Alert>
      )}

      <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["Meals requested", totals.requested],
            ["Matched", totals.matched],
            ["Delivered", totals.delivered],
            ["Still needed", totals.remaining],
          ] as const
        ).map(([label, value]) => (
          <Card key={label} className="flex flex-col-reverse p-4 sm:p-5">
            <dt className="text-xs font-medium text-ink-600 sm:text-sm">{label}</dt>
            <dd className="font-display text-2xl font-semibold text-brand-950 tabular-nums sm:text-3xl">{formatNumber(value)}</dd>
          </Card>
        ))}
      </dl>

      <Card className="overflow-hidden">
        <div className="border-b border-cream-200 bg-cream-50 px-4 py-3 sm:px-6">
          <nav aria-label="Filter requests" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
            {tabs.map((t) => {
              const current = stage === t.value;
              return (
                <Link
                  key={t.value}
                  href={t.value === "all" ? "/ngo/requests" : `/ngo/requests?stage=${t.value}`}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold",
                    current
                      ? "border-brand-950 bg-brand-950 text-cream-50"
                      : "border-brand-900/10 bg-white text-ink-600 hover:bg-cream-100",
                  )}
                >
                  {t.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-xs tabular-nums",
                      current ? "bg-accent-400 text-brand-950" : "bg-cream-200 text-ink-600",
                    )}
                  >
                    {t.count}
                  </span>
                </Link>
              );
            })}
          </nav>
          {stage !== "all" && <p className="mt-2 text-sm text-ink-500">{STAGE_META[stage].description}</p>}
        </div>
        {shown.length ? (
          <NeedList items={shown} />
        ) : (
          <EmptyState
            title={stage === "all" ? "No food requests yet" : `No ${STAGE_META[stage].label.toLowerCase()} requests`}
            description="Post what you need: food type, quantity, people and time. We’ll match available donations to it."
            action={
              verified && (
                <Link
                  href="/ngo/requests/new"
                  className="inline-flex h-11 items-center rounded-full bg-brand-600 px-6 text-sm font-semibold text-white shadow-glow hover:bg-brand-700"
                >
                  New request
                </Link>
              )
            }
          />
        )}
      </Card>

      <Card className="mt-6 overflow-hidden">
        <CardHeader title="Donations you asked for" description="Food you requested directly from Find food." />
        {direct.length ? (
          <RequestList items={direct} />
        ) : (
          <p className="px-6 py-8 text-center text-sm text-ink-500">None yet. Browse Find food to request a specific donation.</p>
        )}
      </Card>

      <Card className="mt-6 overflow-hidden">
        <CardHeader title="Distribution records" description="Donations you received and served." />
        {distributions.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-cream-50 text-xs tracking-wider text-ink-500 uppercase">
                <tr>
                  <th className="px-6 py-3 font-semibold">Food</th>
                  <th className="px-4 py-3 font-semibold">From</th>
                  <th className="px-4 py-3 text-right font-semibold">Meals served</th>
                  <th className="px-6 py-3 font-semibold">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {distributions.map((d) => (
                  <tr key={d.id}>
                    <td className="px-6 py-3">
                      <Link href={`/ngo/donations/${d.id}`} className="font-medium text-brand-950 hover:text-brand-700">
                        {d.foodType}
                      </Link>
                      <span className="block text-xs text-ink-500">
                        {d.quantity} {UNIT_SHORT[d.unit]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-700">{d.donorName}</td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-950 tabular-nums">{formatNumber(d.meals)}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-ink-600">{formatDateTime(d.completedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-6 py-8 text-center text-sm text-ink-500">Donations you mark as distributed appear here.</p>
        )}
      </Card>
    </>
  );
}
