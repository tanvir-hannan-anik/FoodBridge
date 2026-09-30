import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar, ResultNote, Table, Tabs, Td, UserStatusBadge } from "@/components/admin/admin-ui";
import { UserActions } from "@/components/admin/user-actions";
import { PageHeader } from "@/components/layout/page-header";
import { Card, EmptyState } from "@/components/ui";
import { USER_STATUSES } from "@/db/schema";
import { parseAdminFilters } from "@/lib/admin/filters";
import { ROLE_VIEWS, USER_STATUS_META } from "@/lib/admin/meta";
import { listUsers } from "@/lib/admin/service";
import { requireRole } from "@/lib/auth/dal";
import { ROLE_LABEL } from "@/lib/auth/roles";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Users · Admin" };

const LIMIT = 100;
const STATUS_OPTIONS = USER_STATUSES.map((s) => ({ value: s, label: USER_STATUS_META[s].label }));
const ACTIVITY_LABEL = { donor: "Donations", ngo: "Received", volunteer: "Deliveries" } as const;

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  await requireRole("admin");
  const params = await searchParams;
  const role = ROLE_VIEWS.find((r) => r.value === params.role)?.value;
  const filters = parseAdminFilters(params, USER_STATUSES);
  const rows = await listUsers({ ...filters, role }, LIMIT);

  const tabHref = (value?: string) => {
    const p = new URLSearchParams();
    if (value) p.set("role", value);
    if (filters.status) p.set("status", filters.status);
    return `/admin/users${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <PageHeader eyebrow="Admin" title="Users" description="Donors, NGOs and volunteers. Verify, suspend or deactivate accounts." />
      <Tabs
        current={role ?? "all"}
        items={[{ value: "all", label: "Everyone", href: tabHref() }, ...ROLE_VIEWS.map((r) => ({ value: r.value, label: r.label, href: tabHref(r.value) }))]}
      />
      <Card className="overflow-hidden">
        <FilterBar
          path="/admin/users"
          filters={filters}
          statusOptions={STATUS_OPTIONS}
          searchPlaceholder="Name, email, phone or organisation"
          hidden={role ? { role } : {}}
        />
        {rows.length ? (
          <>
            <Table head={["Name", "Role", "Status", "Location", role ? ACTIVITY_LABEL[role] : "Activity", "Joined", ""]}>
              {rows.map((u) => (
                <tr key={u.id}>
                  <Td>
                    <Link href={`/admin/users/${u.id}`} className="font-semibold text-brand-950 hover:text-brand-700">
                      {u.role === "ngo" && u.organizationName ? u.organizationName : u.name}
                    </Link>
                    <span className="block text-xs text-ink-500">{u.email}</span>
                  </Td>
                  <Td className="text-ink-700">
                    {ROLE_LABEL[u.role]}
                    {u.role === "volunteer" && u.status === "active" && (
                      <span className="block text-xs text-ink-500">{u.available ? "Available" : "Unavailable"}</span>
                    )}
                  </Td>
                  <Td>
                    <UserStatusBadge status={u.status} />
                  </Td>
                  <Td className="text-ink-700">{u.area ?? "—"}</Td>
                  <Td className="text-right tabular-nums">{u.activity}</Td>
                  <Td className="whitespace-nowrap text-ink-600">{formatDate(u.createdAt)}</Td>
                  <Td>
                    <UserActions userId={u.id} role={u.role as "donor" | "ngo" | "volunteer"} status={u.status} compact />
                  </Td>
                </tr>
              ))}
            </Table>
            <ResultNote count={rows.length} limit={LIMIT} />
          </>
        ) : (
          <EmptyState title="No users found" description="Try a different search or clear the filters." />
        )}
      </Card>
    </>
  );
}
