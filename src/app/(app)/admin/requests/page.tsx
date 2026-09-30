import type { Metadata } from "next";
import Link from "next/link";
import { acceptMatchAsAdmin, cancelNeedAsAdmin, cancelRequestAsAdmin, rejectMatchAsAdmin } from "@/app/actions/admin";
import { FilterBar, ResultNote, Table, Tabs, Td } from "@/components/admin/admin-ui";
import { StageBadge } from "@/components/ngo/stage-badge";
import { NeedProgressBar } from "@/components/requests/need-list";
import { PageHeader } from "@/components/layout/page-header";
import { Badge, Card, EmptyState, SubmitButton } from "@/components/ui";
import { REQUEST_STATUSES } from "@/db/schema";
import { parseAdminFilters } from "@/lib/admin/filters";
import { REQUEST_STATUS_META } from "@/lib/admin/meta";
import { listAdminClaims } from "@/lib/admin/service";
import { requireRole } from "@/lib/auth/dal";
import { CATEGORY_LABEL, STATUS_META, UNIT_SHORT } from "@/lib/donations/meta";
import { listAllocations } from "@/lib/matching/service";
import { STAGE_META, STAGES } from "@/lib/ngo/meta";
import { listAllNeeds } from "@/lib/requests/service";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Requests · Admin" };

const LIMIT = 100;

export default async function AdminRequestsPage({ searchParams }: PageProps<"/admin/requests">) {
  await requireRole("admin");
  const params = await searchParams;
  const view = params.view === "donations" || params.view === "allocations" ? params.view : "needs";

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Requests"
        description="NGO food requests, the donations requested or matched for them, and what was allocated where."
      />
      <Tabs
        current={view}
        items={[
          { value: "needs", label: "Food requests", href: "/admin/requests" },
          { value: "donations", label: "Donation requests & matches", href: "/admin/requests?view=donations" },
          { value: "allocations", label: "Allocations", href: "/admin/requests?view=allocations" },
        ]}
      />
      {view === "needs" ? <NeedsTable params={params} /> : view === "donations" ? <ClaimsTable params={params} /> : <AllocationsTable />}
    </>
  );
}

/** The matching history's ledger: which donation (or part of one) went to which NGO, and when. */
async function AllocationsTable() {
  const rows = await listAllocations(LIMIT);
  return (
    <Card className="overflow-hidden">
      {rows.length ? (
        <>
          <Table head={["When", "Donation", "Allocated to", "Quantity", "Delivery"]}>
            {rows.map((a) => (
              <tr key={a.id}>
                <Td className="whitespace-nowrap text-ink-600">{formatDateTime(a.createdAt)}</Td>
                <Td>
                  <Link href={`/admin/donations/${a.donationId}`} className="font-semibold text-brand-950 hover:text-brand-700">
                    {a.foodType}
                  </Link>
                  <span className="block text-xs text-ink-500">{a.needId ? "System match" : "Direct request"}</span>
                </Td>
                <Td>
                  <Link href={`/admin/users/${a.ngoId}`} className="text-brand-950 hover:text-brand-700">
                    {a.ngoName}
                  </Link>
                </Td>
                <Td className="text-ink-700">
                  {a.quantity} {UNIT_SHORT[a.unit]}
                  {a.people ? ` · ${a.people} people` : ""}
                  {a.note && <span className="block text-xs text-ink-500">{a.note}</span>}
                </Td>
                <Td className="text-ink-700">{STATUS_META[a.donationStatus].label}</Td>
              </tr>
            ))}
          </Table>
          <ResultNote count={rows.length} limit={LIMIT} />
        </>
      ) : (
        <EmptyState title="Nothing allocated yet" description="Accepted matches and requests appear here." />
      )}
    </Card>
  );
}

type Params = Record<string, string | string[] | undefined>;

async function NeedsTable({ params }: { params: Params }) {
  const filters = parseAdminFilters(params, STAGES);
  const rows = await listAllNeeds({ ...filters, stage: filters.status }, LIMIT);
  return (
    <Card className="overflow-hidden">
      <FilterBar
        path="/admin/requests"
        filters={filters}
        statusOptions={STAGES.map((s) => ({ value: s, label: STAGE_META[s].label }))}
        searchPlaceholder="NGO or food"
      />
      {rows.length ? (
        <>
          <Table head={["Request", "NGO", "Status", "Progress (meals)", "Needed by", ""]}>
            {rows.map((n) => (
              <tr key={n.id}>
                <Td>
                  <p className="font-semibold text-brand-950">{n.foodType || (n.category ? CATEGORY_LABEL[n.category] : "Any food")}</p>
                  <span className="block text-xs text-ink-500">
                    {n.quantity} {UNIT_SHORT[n.unit]} · {n.people} people · {n.area}
                  </span>
                </Td>
                <Td>
                  <Link href={`/admin/users/${n.ngoId}`} className="text-brand-950 hover:text-brand-700">
                    {n.ngoName}
                  </Link>
                </Td>
                <Td>
                  <StageBadge stage={n.stage} />
                </Td>
                <Td className="min-w-52">
                  <NeedProgressBar progress={n.progress} />
                </Td>
                <Td className="whitespace-nowrap text-ink-600">{formatDateTime(n.neededBy)}</Td>
                <Td>
                  {n.status === "OPEN" && n.stage !== "cancelled" && (
                    <form action={cancelNeedAsAdmin.bind(null, n.id)}>
                      <SubmitButton size="sm" variant="outline" className="rounded-full px-3">
                        Cancel
                      </SubmitButton>
                    </form>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
          <ResultNote count={rows.length} limit={LIMIT} />
        </>
      ) : (
        <EmptyState title="No food requests found" description="NGOs’ food requests appear here." />
      )}
    </Card>
  );
}

async function ClaimsTable({ params }: { params: Params }) {
  const filters = parseAdminFilters(params, REQUEST_STATUSES);
  const rows = await listAdminClaims(filters, LIMIT);
  return (
    <Card className="overflow-hidden">
      <FilterBar
        path="/admin/requests"
        filters={filters}
        statusOptions={REQUEST_STATUSES.map((s) => ({ value: s, label: REQUEST_STATUS_META[s].label }))}
        searchPlaceholder="NGO or food"
        hidden={{ view: "donations" }}
      />
      {rows.length ? (
        <>
          <Table head={["Donation", "NGO", "Request status", "Donation status", "When", ""]}>
            {rows.map((r) => (
              <tr key={r.id}>
                <Td>
                  <Link href={`/admin/donations/${r.donationId}`} className="font-semibold text-brand-950 hover:text-brand-700">
                    {r.foodType}
                  </Link>
                  <span className="block text-xs text-ink-500">
                    {r.quantity} {UNIT_SHORT[r.unit]} for {r.people} people · {r.needId ? "system match" : "direct"}
                  </span>
                </Td>
                <Td>
                  <Link href={`/admin/users/${r.ngoId}`} className="text-brand-950 hover:text-brand-700">
                    {r.ngoName}
                  </Link>
                  <span className="block text-xs text-ink-500">{r.ngoArea ?? "—"}</span>
                </Td>
                <Td>
                  <Badge tone={REQUEST_STATUS_META[r.status].tone}>{REQUEST_STATUS_META[r.status].label}</Badge>
                </Td>
                <Td className="text-ink-700">{STATUS_META[r.donationStatus].label}</Td>
                <Td className="whitespace-nowrap text-ink-600">{formatDateTime(r.createdAt)}</Td>
                <Td>
                  <div className="flex flex-wrap gap-2">
                    {r.status === "MATCHED" && (
                      <>
                        <form action={acceptMatchAsAdmin.bind(null, r.id)}>
                          <SubmitButton size="sm" className="rounded-full px-3" pendingLabel="Accepting…">
                            Accept
                          </SubmitButton>
                        </form>
                        <form action={rejectMatchAsAdmin.bind(null, r.id)}>
                          <SubmitButton size="sm" variant="outline" className="rounded-full px-3">
                            Reject
                          </SubmitButton>
                        </form>
                      </>
                    )}
                    {r.status === "PENDING" && (
                      <form action={cancelRequestAsAdmin.bind(null, r.id)}>
                        <SubmitButton size="sm" variant="outline" className="rounded-full px-3">
                          Withdraw
                        </SubmitButton>
                      </form>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
          <ResultNote count={rows.length} limit={LIMIT} />
        </>
      ) : (
        <EmptyState title="No requests found" description="Try a different search or clear the filters." />
      )}
    </Card>
  );
}
