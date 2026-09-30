import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { BreakdownTable, monthLabel, ReportSummary } from "@/components/reports/report-view";
import { Card, Input } from "@/components/ui";
import type { FoodCategory } from "@/db/schema";
import { requireRole } from "@/lib/auth/dal";
import { CATEGORY_LABEL } from "@/lib/donations/meta";
import { hasReportFilters, parseReportQuery } from "@/lib/reports/meta";
import { getReport } from "@/lib/reports/service";

export const metadata: Metadata = { title: "Report · NGO" };

/** The NGO's own report: food received and meals served, by month and category. */
export default async function NgoReportPage({ searchParams }: PageProps<"/ngo/reports">) {
  const ngo = await requireRole("ngo");
  const { fromRaw, toRaw, from, to } = parseReportQuery(await searchParams);
  const report = await getReport({ ngoId: ngo.id, from, to });

  return (
    <>
      <PageHeader eyebrow="NGO" title="Your report" description="Food delivered to your organisation and the meals you served. Useful for donors, funders and your own records." />

      <Card className="mb-6 overflow-hidden">
        <form method="get" action="/ngo/reports" className="grid grid-cols-2 gap-3 bg-cream-50 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-5">
          <Input label="From" name="from" type="date" defaultValue={fromRaw} />
          <Input label="To" name="to" type="date" defaultValue={toRaw} />
          <div className="col-span-2 flex gap-2 sm:col-span-1">
            <button type="submit" className="h-10 rounded-full bg-brand-950 px-5 text-sm font-semibold text-cream-50 hover:bg-brand-800">
              Apply
            </button>
            {hasReportFilters({ from, to }) && (
              <Link href="/ngo/reports" className="grid h-10 place-items-center rounded-full border border-brand-900/15 px-4 text-sm font-semibold text-brand-900 hover:bg-cream-100">
                Reset
              </Link>
            )}
          </div>
        </form>
      </Card>

      <ReportSummary row={report.summary} audience="ngo" />

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <BreakdownTable title="By month" description="When the donation was posted." first="Month" rows={report.byMonth} label={monthLabel} audience="ngo" />
        <BreakdownTable title="By food category" first="Category" rows={report.byCategory} label={(k) => CATEGORY_LABEL[k as FoodCategory] ?? k} audience="ngo" />
      </div>
    </>
  );
}
