import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { BreakdownTable, monthLabel, ReportSummary } from "@/components/reports/report-view";
import { Card, Input, Select } from "@/components/ui";
import { DONATION_STATUSES, DONOR_TYPES, type DonorType, type FoodCategory } from "@/db/schema";
import { requireRole } from "@/lib/auth/dal";
import { CATEGORY_LABEL, DONOR_TYPE_LABEL, STATUS_META } from "@/lib/donations/meta";
import { EXPORT_DATASETS, EXPORT_ROLES, hasReportFilters, parseReportQuery, reportQueryString, type ExportDataset } from "@/lib/reports/meta";
import { getReport } from "@/lib/reports/service";
import { getI18n } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Reports") };
}

const STATUS_OPTIONS = [{ value: "", label: "Any status" }, ...DONATION_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label }))];
const TYPE_OPTIONS = [{ value: "", label: "All donor types" }, ...DONOR_TYPES.map((t) => ({ value: t, label: DONOR_TYPE_LABEL[t].split(" (")[0] }))];
const ROLE_LABEL = { donor: "Donors", ngo: "NGOs", volunteer: "Volunteers" } as const;

export default async function AdminReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  await requireRole("admin");
  const query = parseReportQuery(await searchParams);
  const report = await getReport(query);
  const i18n = await getI18n();
  const { t } = i18n;
  const exportHref = (dataset: ExportDataset, extra: Record<string, string> = {}) => `/api/admin/export/${dataset}${reportQueryString(query, extra)}`;

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Reports"
        description="Food donated, distributed and lost, from the donation records. Filter by date, location, donor type and status."
      />

      <Card className="mb-6 overflow-hidden">
        <form method="get" action="/admin/reports" className="grid grid-cols-2 gap-3 bg-cream-50 p-4 sm:p-5 md:grid-cols-5 md:items-end">
          <Input label="From" name="from" type="date" defaultValue={query.fromRaw} />
          <Input label="To" name="to" type="date" defaultValue={query.toRaw} />
          <Input label="Location" name="location" defaultValue={query.location} placeholder="Area, e.g. Mirpur" />
          <Select label="Donor type" name="type" options={TYPE_OPTIONS} defaultValue={query.donorType ?? ""} />
          <Select label="Status" name="status" options={STATUS_OPTIONS} defaultValue={query.status ?? ""} />
          <div className="col-span-2 flex flex-wrap gap-2 md:col-span-5">
            <button type="submit" className="h-10 rounded-full bg-brand-950 px-5 text-sm font-semibold text-cream-50 hover:bg-brand-800">
              {t("Apply filters")}
            </button>
            {hasReportFilters(query) && (
              <Link href="/admin/reports" className="grid h-10 place-items-center rounded-full border border-brand-900/15 px-4 text-sm font-semibold text-brand-900 hover:bg-cream-100">
                {t("Reset")}
              </Link>
            )}
          </div>
        </form>
        <div className="flex flex-wrap items-center gap-2 border-t border-cream-200 px-4 py-3 sm:px-5">
          <span className="mr-1 text-xs font-semibold tracking-widest text-ink-500 uppercase">{t("Export CSV")}</span>
          {(["report", "donations", "deliveries", "requests"] as const).map((d) => (
            <ExportLink key={d} href={exportHref(d)} label={t(EXPORT_DATASETS[d])} />
          ))}
          {EXPORT_ROLES.map((r) => (
            <ExportLink key={r} href={exportHref("users", { role: r })} label={t(ROLE_LABEL[r])} />
          ))}
          <p className="w-full text-xs text-ink-500">
            {t(
              "Exports use these filters (users: location and date joined) and leave out contact details, home addresses and exact locations. Each export is logged.",
            )}
          </p>
        </div>
      </Card>

      <ReportSummary row={report.summary} audience="admin" />

      <div className="mt-6 space-y-6">
        <BreakdownTable title="By month" description="When the food was posted." first="Month" rows={report.byMonth} label={(k) => monthLabel(k, i18n)} audience="admin" />
        <BreakdownTable title="By area" description="The donor’s area (top 25)." first="Area" rows={report.byArea} audience="admin" />
        <div className="grid gap-6 xl:grid-cols-2">
          <BreakdownTable
            title="By donor type"
            first="Donor type"
            rows={report.byDonorType}
            label={(k) => DONOR_TYPE_LABEL[k as DonorType]?.split(" (")[0] ?? k}
            audience="admin"
          />
          <BreakdownTable title="By food category" first="Category" rows={report.byCategory} label={(k) => CATEGORY_LABEL[k as FoodCategory] ?? k} audience="admin" />
        </div>
      </div>
    </>
  );
}

function ExportLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      download
      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-brand-900/15 bg-white px-3 text-xs font-semibold text-brand-900 hover:bg-cream-100"
    >
      <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
        <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" />
      </svg>
      {label}
    </a>
  );
}
