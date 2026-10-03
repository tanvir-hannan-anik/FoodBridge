import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Table, Td, UserStatusBadge } from "@/components/admin/admin-ui";
import { UserActions } from "@/components/admin/user-actions";
import { StatusBadge } from "@/components/donor/status-badge";
import { Card, CardBody, CardHeader } from "@/components/ui";
import { ADMIN_ACTION_LABEL } from "@/lib/admin/meta";
import { getAdminUser } from "@/lib/admin/service";
import { requireRole } from "@/lib/auth/dal";
import { ROLE_LABEL } from "@/lib/auth/roles";
import { DONOR_TYPE_LABEL, UNIT_SHORT } from "@/lib/donations/meta";
import { NGO_TYPE_LABEL } from "@/lib/ngo/meta";
import { getI18n } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("User") };
}

const RECENT_TITLE = { donor: "Recent donations", ngo: "Donations received", volunteer: "Delivery tasks" } as const;

export default async function AdminUserPage({ params }: PageProps<"/admin/users/[id]">) {
  await requireRole("admin");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const user = await getAdminUser(id);
  if (!user) notFound();
  const role = user.role as "donor" | "ngo" | "volunteer";
  const { t, date, dateTime, number } = await getI18n();

  return (
    <div className="space-y-6">
      <Link href={`/admin/users?role=${role}`} className="text-sm font-medium text-ink-500 hover:text-brand-800">
        ← {t(`${ROLE_LABEL[role]}s`)}
      </Link>

      <Card>
        <CardBody className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-widest text-ink-500 uppercase">{t(ROLE_LABEL[role])}</p>
              <h1 className="mt-1 font-display text-3xl font-semibold text-brand-950">
                {role === "ngo" && user.organizationName ? user.organizationName : user.name}
              </h1>
              <p className="mt-1 text-sm text-ink-600">
                {user.email} · {user.phone}
              </p>
            </div>
            <UserStatusBadge status={user.status} />
          </div>
          <UserActions userId={user.id} role={role} status={user.status} />
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Details" />
          <CardBody>
            <dl className="space-y-4">
              {role === "ngo" && <Detail label="Contact person">{user.name}</Detail>}
              {role === "ngo" && <Detail label="Type">{user.ngoType ? t(NGO_TYPE_LABEL[user.ngoType]) : "—"}</Detail>}
              {role === "ngo" && <Detail label="Registration no.">{user.registrationNo ?? "—"}</Detail>}
              {role === "ngo" && <Detail label="People served per day">{user.capacity !== null ? number(user.capacity) : "—"}</Detail>}
              {role === "donor" && <Detail label="Donor type">{user.donorType ? t(DONOR_TYPE_LABEL[user.donorType]) : "—"}</Detail>}
              {role === "donor" && user.organizationName && <Detail label="Business">{user.organizationName}</Detail>}
              {role === "volunteer" && <Detail label="Availability">{t(user.available ? "Available" : "Unavailable")}</Detail>}
              <Detail label="Area">{user.area ?? "—"}</Detail>
              <Detail label="Address">{user.address ?? "—"}</Detail>
              {user.description && <Detail label="About">{user.description}</Detail>}
              <Detail label="Joined">{date(user.createdAt)}</Detail>
            </dl>
          </CardBody>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader title={RECENT_TITLE[role]} />
            {user.recent.length ? (
              <Table head={["Food", "Status", "Updated"]}>
                {user.recent.map((d) => (
                  <tr key={d.id}>
                    <Td>
                      <Link href={`/admin/donations/${d.id}`} className="font-medium text-brand-950 hover:text-brand-700">
                        {d.foodType}
                      </Link>
                      <span className="block text-xs text-ink-500">
                        {number(d.quantity)} {t(UNIT_SHORT[d.unit])}
                      </span>
                    </Td>
                    <Td>
                      <StatusBadge status={d.status} />
                    </Td>
                    <Td className="whitespace-nowrap text-ink-600">{dateTime(d.updatedAt)}</Td>
                  </tr>
                ))}
              </Table>
            ) : (
              <p className="px-6 py-8 text-center text-sm text-ink-500">{t("Nothing yet.")}</p>
            )}
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Admin history" description="Verification and account changes." />
            {user.log.length ? (
              <ul className="divide-y divide-cream-200">
                {user.log.map((l) => (
                  <li key={l.id} className="px-6 py-3 text-sm">
                    <span className="font-semibold text-brand-950">{t(ADMIN_ACTION_LABEL[l.action] ?? l.action)}</span>
                    <span className="text-ink-500">
                      {" "}
                      · {dateTime(l.createdAt)}
                      {l.actorName ? ` · ${l.actorName}` : ""}
                    </span>
                    {l.note && <span className="block text-ink-700">{l.note}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-6 py-8 text-center text-sm text-ink-500">{t("No admin actions yet.")}</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

async function Detail({ label, children }: { label: string; children: ReactNode }) {
  const { t } = await getI18n();
  return (
    <div>
      <dt className="text-xs font-semibold tracking-widest text-ink-500 uppercase">{t(label)}</dt>
      <dd className="mt-1 text-sm text-brand-950">{children}</dd>
    </div>
  );
}
