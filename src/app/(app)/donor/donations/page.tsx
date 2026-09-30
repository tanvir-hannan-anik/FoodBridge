import type { Metadata } from "next";
import Link from "next/link";
import { DonationList } from "@/components/donor/donation-list";
import { PageHeader } from "@/components/layout/page-header";
import { Card, EmptyState } from "@/components/ui";
import { requireRole } from "@/lib/auth/dal";
import { getDonorStats, listDonorDonations, sweepDonorDonations } from "@/lib/donations/service";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My donations" };

const TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
] as const;

export default async function DonationsPage({ searchParams }: PageProps<"/donor/donations">) {
  const donor = await requireRole("donor");
  const { filter: raw } = await searchParams;
  const filter = TABS.find((t) => t.value === raw)?.value ?? "all";

  await sweepDonorDonations(donor.id);
  const [items, stats] = await Promise.all([listDonorDonations(donor.id, filter, 100), getDonorStats(donor.id)]);
  const counts = { all: stats.total, active: stats.active, completed: stats.completed };

  return (
    <>
      <PageHeader
        eyebrow="Donations"
        title="My donations"
        description="Every donation you’ve posted, with its live status."
        action={
          <Link
            href="/donor/donate"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 font-semibold text-white shadow-glow hover:bg-brand-700"
          >
            <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Donate food
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-200 bg-cream-50 px-4 py-3 sm:px-6">
          <nav aria-label="Filter donations" className="flex gap-1 rounded-full border border-brand-900/10 bg-white p-1">
            {TABS.map((t) => {
              const current = filter === t.value;
              return (
                <Link
                  key={t.value}
                  href={t.value === "all" ? "/donor/donations" : `/donor/donations?filter=${t.value}`}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold",
                    current ? "bg-brand-950 text-cream-50" : "text-ink-600 hover:bg-cream-100",
                  )}
                >
                  {t.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-xs tabular-nums",
                      current ? "bg-accent-400 text-brand-950" : "bg-cream-200 text-ink-600",
                    )}
                  >
                    {counts[t.value]}
                  </span>
                </Link>
              );
            })}
          </nav>
          <p className="text-sm text-ink-500">
            Showing {items.length} {items.length === 1 ? "donation" : "donations"}
          </p>
        </div>

        {items.length ? (
          <DonationList items={items} />
        ) : (
          <EmptyState
            title={filter === "all" ? "No donations yet" : `No ${filter} donations`}
            description="Donations you post will show up here with their live status."
            action={
              <Link
                href="/donor/donate"
                className="inline-flex h-11 items-center rounded-full bg-brand-600 px-6 text-sm font-semibold text-white shadow-glow hover:bg-brand-700"
              >
                Donate food
              </Link>
            }
          />
        )}
      </Card>
    </>
  );
}
