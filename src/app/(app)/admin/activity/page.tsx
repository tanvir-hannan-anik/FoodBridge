import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar, ResultNote, Table, Tabs, Td } from "@/components/admin/admin-ui";
import { PageHeader } from "@/components/layout/page-header";
import { Badge, Card, EmptyState } from "@/components/ui";
import { parseAdminFilters } from "@/lib/admin/filters";
import { ACTIVITY_TARGETS, ADMIN_ACTION_LABEL, SECURITY_ACTIONS } from "@/lib/admin/meta";
import { listActivity, type ActivityRow } from "@/lib/admin/service";
import { requireRole } from "@/lib/auth/dal";
import { ROLE_LABEL } from "@/lib/auth/roles";
import { getI18n } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Activity log") };
}

const LIMIT = 100;
const ACTIONS = Object.keys(ADMIN_ACTION_LABEL);
const ACTION_OPTIONS = ACTIONS.map((a) => ({ value: a, label: ADMIN_ACTION_LABEL[a] }));

export default async function AdminActivityPage({ searchParams }: PageProps<"/admin/activity">) {
  await requireRole("admin");
  const params = await searchParams;
  const type = ACTIVITY_TARGETS.find((t) => t.value === params.type)?.value;
  const filters = parseAdminFilters(params, ACTIONS);
  const rows = await listActivity({ ...filters, type }, LIMIT);
  const { t, dateTime } = await getI18n();

  const tabHref = (value?: string) => {
    const p = new URLSearchParams();
    if (value) p.set("type", value);
    if (filters.status) p.set("status", filters.status);
    return `/admin/activity${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Activity log"
        description="Important actions on the platform: verifications, suspensions, corrections, cancellations, exports and sign-in alerts."
      />
      <Tabs
        current={type ?? "all"}
        items={[{ value: "all", label: "Everything", href: tabHref() }, ...ACTIVITY_TARGETS.map((t) => ({ value: t.value, label: t.label, href: tabHref(t.value) }))]}
      />
      <Card className="overflow-hidden">
        <FilterBar
          path="/admin/activity"
          filters={filters}
          statusOptions={ACTION_OPTIONS}
          statusLabel="Action"
          anyStatusLabel="Any action"
          showLocation={false}
          searchPlaceholder="Who, what or note"
          hidden={type ? { type } : {}}
        />
        {rows.length ? (
          <>
            <Table head={["When", "Action", "About", "By", "Note"]}>
              {rows.map((a) => (
                <tr key={a.id}>
                  <Td className="whitespace-nowrap text-ink-600">{dateTime(a.createdAt)}</Td>
                  <Td className="text-ink-800">
                    {t(ADMIN_ACTION_LABEL[a.action] ?? a.action)}
                    {SECURITY_ACTIONS.includes(a.action) && (
                      <Badge tone="warning" className="ml-2">
                        Security
                      </Badge>
                    )}
                  </Td>
                  <Td>
                    <Target a={a} />
                  </Td>
                  <Td className="text-ink-700">
                    {a.actorName ?? t("System")}
                    {a.actorRole && <span className="block text-xs text-ink-500">{t(ROLE_LABEL[a.actorRole])}</span>}
                  </Td>
                  <Td className="max-w-xs text-ink-600">{a.note ?? "—"}</Td>
                </tr>
              ))}
            </Table>
            <ResultNote count={rows.length} limit={LIMIT} />
          </>
        ) : (
          <EmptyState title="No activity found" description="Admin actions, exports and sign-in alerts appear here." />
        )}
      </Card>
    </>
  );
}

const TYPE_LABEL = Object.fromEntries(ACTIVITY_TARGETS.map((t) => [t.value, t.label])) as Record<ActivityRow["targetType"], string>;

/** What the entry is about, linked to the admin page for it when there is one. */
async function Target({ a }: { a: ActivityRow }) {
  const { t } = await getI18n();
  const href =
    a.action === "data_export"
      ? null
      : a.targetType === "user"
        ? `/admin/users/${a.targetId}`
        : a.targetType === "donation"
          ? `/admin/donations/${a.targetId}`
          : a.targetType === "request" && a.requestDonationId
            ? `/admin/donations/${a.requestDonationId}`
            : a.targetType === "need"
              ? "/admin/requests"
              : null;
  const label = a.action === "data_export" ? t("Report data") : (a.targetLabel ?? t("Removed record"));
  return (
    <>
      {href ? (
        <Link href={href} className="font-medium text-brand-950 hover:text-brand-700">
          {label}
        </Link>
      ) : (
        <span className="text-ink-700">{label}</span>
      )}
      <span className="block text-xs text-ink-500">{t(TYPE_LABEL[a.targetType])}</span>
    </>
  );
}
