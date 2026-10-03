import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar, ResultNote, Table, Td } from "@/components/admin/admin-ui";
import { StatusBadge } from "@/components/donor/status-badge";
import { SafetyBadge } from "@/components/safety-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Card, EmptyState } from "@/components/ui";
import { DONATION_STATUSES } from "@/db/schema";
import { parseAdminFilters } from "@/lib/admin/filters";
import { listAdminDonations } from "@/lib/admin/service";
import { requireRole } from "@/lib/auth/dal";
import { STATUS_META, UNIT_SHORT } from "@/lib/donations/meta";
import { getI18n } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Donations") };
}

const LIMIT = 100;
const STATUS_OPTIONS = DONATION_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label }));

export default async function AdminDonationsPage({ searchParams }: PageProps<"/admin/donations">) {
  await requireRole("admin");
  const filters = parseAdminFilters(await searchParams, DONATION_STATUSES);
  const rows = await listAdminDonations(filters, LIMIT);
  const { t, dateTime, number } = await getI18n();

  return (
    <>
      <PageHeader eyebrow="Admin" title="Donations" description="Every donation from posting to distribution. Open one to update, cancel or trace it." />
      <Card className="overflow-hidden">
        <FilterBar path="/admin/donations" filters={filters} statusOptions={STATUS_OPTIONS} searchPlaceholder="Food, donor or NGO" />
        {rows.length ? (
          <>
            <Table head={["Food", "Status", "Donor", "NGO / volunteer", "Best before", "Posted"]}>
              {rows.map((d) => (
                <tr key={d.id}>
                  <Td>
                    <Link href={`/admin/donations/${d.id}`} className="font-semibold text-brand-950 hover:text-brand-700">
                      {d.foodType}
                    </Link>
                    <span className="block text-xs text-ink-500">
                      {number(d.quantity)} {t(UNIT_SHORT[d.unit])}
                    </span>
                  </Td>
                  <Td>
                    <StatusBadge status={d.status} />
                    {(["PENDING", "MATCHED", "ASSIGNED"].includes(d.status) || d.safetyFlag) && (
                      <SafetyBadge expiresAt={d.expiresAt} safetyFlag={d.safetyFlag} showTime={false} className="mt-1" />
                    )}
                  </Td>
                  <Td className="text-ink-700">
                    {d.donorName}
                    <span className="block text-xs text-ink-500">{d.donorArea ?? d.pickupAddress}</span>
                  </Td>
                  <Td className="text-ink-700">
                    {d.ngoName ?? "—"}
                    {d.volunteerName && (
                      <span className="block text-xs text-ink-500">{t("Volunteer: {name}", { name: d.volunteerName })}</span>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap text-ink-600">{dateTime(d.expiresAt)}</Td>
                  <Td className="whitespace-nowrap text-ink-600">{dateTime(d.createdAt)}</Td>
                </tr>
              ))}
            </Table>
            <ResultNote count={rows.length} limit={LIMIT} />
          </>
        ) : (
          <EmptyState title="No donations found" description="Try a different search or clear the filters." />
        )}
      </Card>
    </>
  );
}
