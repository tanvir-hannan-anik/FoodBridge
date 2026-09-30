import type { ReactNode } from "react";
import { Table, Td } from "@/components/admin/admin-ui";
import { Card, CardHeader } from "@/components/ui";
import type { ReportRow } from "@/lib/reports/service";
import { cn, formatNumber } from "@/lib/utils";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};

/** The five headline numbers of a report. */
export function ReportSummary({ row, audience }: { row: ReportRow; audience: "admin" | "ngo" }) {
  const cards: { label: string; value: number; hint: string; highlight?: boolean }[] =
    audience === "admin"
      ? [
          { label: "Food donated", value: row.postedMeals, hint: `meals · ${formatNumber(row.posted)} donations` },
          { label: "Food distributed", value: row.mealsDelivered, hint: `meals · ${formatNumber(row.delivered)} deliveries`, highlight: true },
          { label: "Meals served", value: row.mealsServed, hint: "reported by NGOs" },
          { label: "Completed deliveries", value: row.delivered, hint: "delivered or distributed" },
          { label: "Expired food", value: row.expiredMeals, hint: `meals · ${formatNumber(row.expired)} donations lost` },
        ]
      : [
          { label: "Food received", value: row.mealsDelivered, hint: `meals · ${formatNumber(row.delivered)} deliveries`, highlight: true },
          { label: "Meals served", value: row.mealsServed, hint: "from your distribution records" },
          { label: "Deliveries", value: row.delivered, hint: "delivered or distributed" },
        ];
  return (
    <dl className={cn("grid grid-cols-2 gap-3", audience === "admin" ? "lg:grid-cols-5" : "sm:grid-cols-3")}>
      {cards.map((c) => (
        <Card key={c.label} className={cn("p-4 sm:p-5", c.highlight && "bg-brand-950 text-cream-50")}>
          <dt className={cn("text-sm font-medium", c.highlight ? "text-brand-200" : "text-ink-600")}>{c.label}</dt>
          <dd className={cn("font-display text-3xl font-semibold tabular-nums", c.highlight ? "text-accent-300" : "text-brand-950")}>{formatNumber(c.value)}</dd>
          <dd className={cn("text-xs", c.highlight ? "text-brand-300" : "text-ink-500")}>{c.hint}</dd>
        </Card>
      ))}
    </dl>
  );
}

/** One breakdown table (by month, area, donor type or category). */
export function BreakdownTable({
  title,
  description,
  first,
  rows,
  label = (k) => k,
  audience,
  action,
}: {
  title: string;
  description?: string;
  first: string;
  rows: ReportRow[];
  label?: (key: string) => string;
  audience: "admin" | "ngo";
  action?: ReactNode;
}) {
  const admin = audience === "admin";
  const head = admin
    ? [first, "Donations", "Meals donated", "Delivered", "Meals distributed", "Meals served", "Expired"]
    : [first, "Deliveries", "Meals received", "Meals served"];
  return (
    <Card className="overflow-hidden">
      <CardHeader title={title} description={description} action={action} />
      <Table head={head} empty={rows.length ? undefined : <p className="px-6 py-8 text-center text-sm text-ink-500">No data for these filters.</p>}>
        {rows.map((r) => (
          <tr key={r.key}>
            <Td className="font-semibold text-brand-950">{label(r.key)}</Td>
            {admin ? (
              <>
                <Td className="tabular-nums">{formatNumber(r.posted)}</Td>
                <Td className="tabular-nums">{formatNumber(r.postedMeals)}</Td>
                <Td className="tabular-nums">{formatNumber(r.delivered)}</Td>
                <Td className="tabular-nums">{formatNumber(r.mealsDelivered)}</Td>
                <Td className="tabular-nums">{formatNumber(r.mealsServed)}</Td>
                <Td className={cn("tabular-nums", r.expired > 0 && "text-accent-700")}>{formatNumber(r.expired)}</Td>
              </>
            ) : (
              <>
                <Td className="tabular-nums">{formatNumber(r.delivered)}</Td>
                <Td className="tabular-nums">{formatNumber(r.mealsDelivered)}</Td>
                <Td className="tabular-nums">{formatNumber(r.mealsServed)}</Td>
              </>
            )}
          </tr>
        ))}
      </Table>
    </Card>
  );
}
