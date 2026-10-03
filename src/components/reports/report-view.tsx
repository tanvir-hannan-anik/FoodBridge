import type { ReactNode } from "react";
import { Table, Td } from "@/components/admin/admin-ui";
import { Card, CardHeader } from "@/components/ui";
import type { ReportRow } from "@/lib/reports/service";
import { toBnDigits, type I18n } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { cn } from "@/lib/utils";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "Oct 2026" ("অক্টো ২০২৬"). Without i18n: English. */
export const monthLabel = (key: string, i18n?: I18n) => {
  const [y, m] = key.split("-").map(Number);
  if (!i18n) return `${MONTHS[m - 1]} ${y}`;
  return `${i18n.t(MONTHS[m - 1])} ${i18n.lang === "bn" ? toBnDigits(String(y)) : y}`;
};

/** The five headline numbers of a report. */
export async function ReportSummary({ row, audience }: { row: ReportRow; audience: "admin" | "ngo" }) {
  const { t, number } = await getI18n();
  const cards: { label: string; value: number; hint: string; highlight?: boolean }[] =
    audience === "admin"
      ? [
          { label: "Food donated", value: row.postedMeals, hint: t("meals · {n} donations", { n: row.posted }) },
          {
            label: "Food distributed",
            value: row.mealsDelivered,
            hint: t("meals · {n} deliveries", { n: row.delivered }),
            highlight: true,
          },
          { label: "Meals served", value: row.mealsServed, hint: t("reported by NGOs") },
          { label: "Completed deliveries", value: row.delivered, hint: t("delivered or distributed") },
          { label: "Expired food", value: row.expiredMeals, hint: t("meals · {n} donations lost", { n: row.expired }) },
        ]
      : [
          {
            label: "Food received",
            value: row.mealsDelivered,
            hint: t("meals · {n} deliveries", { n: row.delivered }),
            highlight: true,
          },
          { label: "Meals served", value: row.mealsServed, hint: t("from your distribution records") },
          { label: "Deliveries", value: row.delivered, hint: t("delivered or distributed") },
        ];
  return (
    <dl className={cn("grid grid-cols-2 gap-3", audience === "admin" ? "lg:grid-cols-5" : "sm:grid-cols-3")}>
      {cards.map((c) => (
        <Card key={c.label} className={cn("p-4 sm:p-5", c.highlight && "bg-brand-950 text-cream-50")}>
          <dt className={cn("text-sm font-medium", c.highlight ? "text-brand-200" : "text-ink-600")}>{t(c.label)}</dt>
          <dd className={cn("font-display text-3xl font-semibold tabular-nums", c.highlight ? "text-accent-300" : "text-brand-950")}>
            {number(c.value)}
          </dd>
          <dd className={cn("text-xs", c.highlight ? "text-brand-300" : "text-ink-500")}>{c.hint}</dd>
        </Card>
      ))}
    </dl>
  );
}

/** One breakdown table (by month, area, donor type or category). */
export async function BreakdownTable({
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
  const { t, number: formatNumber } = await getI18n();
  const admin = audience === "admin";
  const head = admin
    ? [first, "Donations", "Meals donated", "Delivered", "Meals distributed", "Meals served", "Expired"]
    : [first, "Deliveries", "Meals received", "Meals served"];
  return (
    <Card className="overflow-hidden">
      <CardHeader title={title} description={description} action={action} />
      <Table head={head} empty={rows.length ? undefined : <p className="px-6 py-8 text-center text-sm text-ink-500">{t("No data for these filters.")}</p>}>
        {rows.map((r) => (
          <tr key={r.key}>
            <Td className="font-semibold text-brand-950">{t(label(r.key))}</Td>
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
