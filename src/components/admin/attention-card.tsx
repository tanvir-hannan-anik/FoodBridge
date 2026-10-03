import Link from "next/link";
import type { ReactNode } from "react";
import { StatusBadge } from "@/components/donor/status-badge";
import { Badge, Card, CardHeader } from "@/components/ui";
import { MONITOR_RULES } from "@/lib/admin/meta";
import type { AttentionDonation, getAttentionQueue } from "@/lib/admin/monitor";
import { UNIT_SHORT } from "@/lib/donations/meta";
import { getI18n } from "@/lib/i18n-server";

type Queue = Awaited<ReturnType<typeof getAttentionQueue>>;

/** Operational monitoring on the admin dashboard: food stuck somewhere in the workflow, oldest first. */
export async function AttentionCard({ queue }: { queue: Queue }) {
  const { t, relative, number } = await getI18n();
  const r = MONITOR_RULES;
  const groups: { key: string; title: string; why: string; total: number; items: ReactNode[] }[] = [
    {
      key: "volunteer",
      title: t("Waiting for a volunteer"),
      why: t("Allocated more than {n} minutes ago and nobody has accepted. Offer it to someone.", { n: r.waitingVolunteerMinutes }),
      total: queue.waitingVolunteer.total,
      items: queue.waitingVolunteer.items.map((d) => (
        <DonationRow
          key={d.id}
          d={d}
          detail={`${t("To {ngo}", { ngo: d.ngoName ?? t("an NGO") })} · ${t("allocated {time}", { time: relative(d.since) })}`}
        >
          {d.openToAll && <Badge tone="warning">Open to all</Badge>}
        </DonationRow>
      )),
    },
    {
      key: "pickup",
      title: t("Pickup overdue"),
      why: t("A volunteer accepted but hasn’t picked up {n}+ minutes after the pickup time. Call them or release the task.", {
        n: r.latePickupMinutes,
      }),
      total: queue.latePickup.total,
      items: queue.latePickup.items.map((d) => (
        <DonationRow
          key={d.id}
          d={d}
          detail={`${d.volunteerName ?? t("Volunteer")} · ${t("pickup was {time}", { time: relative(d.pickupAt) })}`}
        />
      )),
    },
    {
      key: "stalled",
      title: t("Delivery not confirmed"),
      why: t("Picked up but no update for {n}+ hours. Check with the volunteer or NGO and record the delivery.", {
        n: r.stalledDeliveryHours,
      }),
      total: queue.stalled.total,
      items: queue.stalled.items.map((d) => (
        <DonationRow
          key={d.id}
          d={d}
          detail={`${d.volunteerName ?? t("Volunteer")} → ${d.ngoName ?? t("NGO")} · ${t("last update {time}", { time: relative(d.since) })}`}
        />
      )),
    },
    {
      key: "unconfirmed",
      title: t("Meals served not recorded"),
      why: t("Delivered {n}+ hours ago; the NGO hasn’t recorded how many people ate.", { n: r.unconfirmedHours }),
      total: queue.unconfirmed.total,
      items: queue.unconfirmed.items.map((d) => (
        <DonationRow key={d.id} d={d} detail={`${d.ngoName ?? t("NGO")} · ${t("delivered {time}", { time: relative(d.since) })}`} />
      )),
    },
    {
      key: "needs",
      title: t("Food requests with no match"),
      why: t("Needed within {n} hours and no food has been matched. Contact the NGO or nearby donors.", { n: r.urgentNeedHours }),
      total: queue.urgentNeeds.total,
      items: queue.urgentNeeds.items.map((n) => (
        <li key={n.id}>
          <Link href={`/admin/users/${n.ngoId}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-6 py-3 text-sm hover:bg-cream-50">
            <span className="min-w-0 flex-1">
              <span className="font-semibold text-brand-950">{n.ngoName}</span>
              <span className="text-ink-600">
                {" "}
                ·{" "}
                {t("{qty} for {people}", {
                  qty: `${number(n.quantity)} ${t(UNIT_SHORT[n.unit])}`,
                  people: t("{n} people", { n: n.people }),
                })}{" "}
                · {n.area}
              </span>
            </span>
            <span className="text-xs font-medium text-accent-700">{t("Needed {time}", { time: relative(n.neededBy) })}</span>
          </Link>
        </li>
      )),
    },
  ].filter((g) => g.total > 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Needs attention"
        description={
          queue.open
            ? t(queue.open === 1 ? "{n} item stuck in the workflow, oldest first." : "{n} items stuck in the workflow, oldest first.", {
                n: queue.open,
              })
            : "Nothing is stuck right now."
        }
        action={
          <Link href="/admin/requests" className="text-sm font-semibold text-brand-700 hover:underline">
            {t("All requests")}
          </Link>
        }
      />
      {groups.length ? (
        <div className="divide-y divide-cream-200">
          {groups.map((g) => (
            <section key={g.key} aria-labelledby={`attn-${g.key}`}>
              <div className="bg-cream-50 px-6 py-3">
                <h3 id={`attn-${g.key}`} className="flex items-center gap-2 text-sm font-semibold text-brand-950">
                  {g.title}
                  <Badge tone="warning">{number(g.total)}</Badge>
                </h3>
                <p className="mt-0.5 text-xs text-ink-600">{g.why}</p>
              </div>
              <ul className="divide-y divide-cream-200">{g.items}</ul>
              {g.total > g.items.length && (
                <p className="px-6 py-2 text-xs text-ink-500">
                  {t("And {n} more.", { n: g.total - g.items.length })}{" "}
                  {g.key !== "needs" && (
                    <Link href="/admin/donations" className="font-semibold text-brand-700 underline">
                      {t("See donations")}
                    </Link>
                  )}
                </p>
              )}
            </section>
          ))}
        </div>
      ) : (
        <p className="flex items-center gap-2 px-6 py-5 text-sm text-ink-600">
          <span aria-hidden className="size-2 rounded-full bg-brand-500" />
          {t("All pickups and deliveries are moving.")}
        </p>
      )}
      {queue.expired.total > 0 && (
        <p className="border-t border-cream-200 px-6 py-3 text-sm text-ink-600">
          <span className="font-semibold text-red-700">{t("{n} expired", { n: queue.expired.total })}</span>{" "}
          {t("in the last {n} hours", { n: r.expiredLookbackHours })} ·{" "}
          <Link href="/admin/donations?status=EXPIRED" className="font-semibold text-brand-700 underline">
            {t("Review expired food")}
          </Link>
        </p>
      )}
    </Card>
  );
}

function DonationRow({ d, detail, children }: { d: AttentionDonation; detail: string; children?: ReactNode }) {
  return (
    <li>
      <Link href={`/admin/donations/${d.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-6 py-3 text-sm hover:bg-cream-50">
        <span className="min-w-0 flex-1">
          <span className="font-semibold text-brand-950">{d.foodType}</span>
          <span className="text-ink-600"> · {d.donorName}</span>
          <span className="block text-xs text-ink-500">{detail}</span>
        </span>
        {children}
        <StatusBadge status={d.status} />
      </Link>
    </li>
  );
}
