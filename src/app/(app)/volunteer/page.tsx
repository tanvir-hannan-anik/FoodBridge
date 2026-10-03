import type { Metadata } from "next";
import Link from "next/link";
import { ActivityCard } from "@/components/dashboard/activity-card";
import { LocateMe } from "@/components/map/locate-me";
import { AvailabilityToggle, TaskList } from "@/components/volunteer/task-list";
import { Alert, Card, EmptyState } from "@/components/ui";
import { parsePeriod } from "@/lib/analytics/meta";
import { getActivity } from "@/lib/analytics/service";
import { requireRole } from "@/lib/auth/dal";
import { greeting } from "@/lib/utils";
import { getI18n } from "@/lib/i18n-server";
import { rich } from "@/lib/i18n-rich";
import { getVolunteerStats, listOpenTasks, listVolunteerTasks, sweepVolunteerTasks } from "@/lib/volunteer/service";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Volunteer dashboard") };
}

export default async function VolunteerDashboard({ searchParams }: PageProps<"/volunteer">) {
  const volunteer = await requireRole("volunteer");
  await sweepVolunteerTasks(volunteer.id);
  const verified = volunteer.status === "active";
  const canTakeTasks = verified && volunteer.available;

  const { welcome, declined, released, period } = await searchParams;
  const [stats, current, pickups, activity] = await Promise.all([
    getVolunteerStats(volunteer.id),
    listVolunteerTasks(volunteer, "current"),
    canTakeTasks ? listOpenTasks(volunteer, 10) : Promise.resolve([]),
    getActivity({ volunteerId: volunteer.id }, parsePeriod(period)),
  ]);
  const assigned = pickups.filter((t) => t.offerStatus === "OFFERED");
  const open = pickups.filter((t) => t.offerStatus !== "OFFERED");
  const { t, number } = await getI18n();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {!verified && (
        <Alert tone="warning" title={welcome ? "Thanks for signing up! Your account is under review" : "Your account is under review"}>
          {rich(
            t(
              "Our team verifies every volunteer before they see pickup addresses, usually within one working day. Meanwhile, {link}.",
            ),
            {
              link: (
                <Link href="/profile" className="font-semibold underline">
                  {t("complete your profile")}
                </Link>
              ),
            },
          )}
        </Alert>
      )}

      {declined && <Alert tone="info">{t("Task declined. We’ve offered it to the next nearest volunteer.")}</Alert>}
      {released && <Alert tone="info">{t("Task handed back. Thanks for letting us know; another volunteer will take it.")}</Alert>}

      <section className="grain relative overflow-hidden rounded-[1.75rem] bg-brand-950 p-5 text-cream-50 sm:p-8">
        <div aria-hidden className="absolute -top-24 -right-16 size-72 rounded-full bg-brand-600/35 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold tracking-widest text-accent-300 uppercase">{t("Volunteer")}</p>
          <h1 className="mt-2 font-display text-2xl leading-tight font-semibold sm:text-4xl">
            {t("{greeting}, {name}", { greeting: t(greeting()), name: volunteer.name.split(" ")[0] })}
          </h1>
          <p className="mt-1 text-sm text-brand-200">
            {volunteer.area ? `${t("Covering {area}.", { area: volunteer.area })} ` : ""}
            {t("Pick up surplus food and bring it to NGOs.")}
          </p>
          <div className="mt-5 space-y-3">
            <AvailabilityToggle available={volunteer.available} disabled={!verified} />
            {verified && <LocateMe locatedAt={volunteer.locatedAt} hasLocation={volunteer.lat !== null} />}
          </div>
        </div>
      </section>

      <dl className="grid grid-cols-3 gap-3">
        <Stat label={t("Active tasks")} value={number(stats.active)} />
        <Stat label={t("Deliveries")} value={number(stats.delivered)} />
        <Stat label={t("Meals delivered")} value={number(stats.meals)} highlight />
      </dl>

      <section>
        <SectionTitle title={t("Current tasks")} href="/volunteer/tasks" linkLabel={t("All tasks")} />
        {current.length ? (
          <TaskList items={current} />
        ) : (
          <Card>
            <EmptyState
              title="No active tasks"
              description={canTakeTasks ? "Accept a new pickup below to get started." : "Tasks you accept will appear here."}
            />
          </Card>
        )}
      </section>

      {assigned.length > 0 && (
        <section>
          <SectionTitle
            title={t("Assigned to you")}
            subtitle={t("You’re the nearest available volunteer. Accept or decline soon.")}
          />
          <TaskList items={assigned} />
        </section>
      )}

      {verified && (
        <section>
          <SectionTitle title={t("Open pickups")} subtitle={t("No one nearby has taken these yet. Nearest first.")} />
          {!volunteer.available ? (
            <Card>
              <EmptyState
                title="You’re unavailable"
                description="Switch to Available to see and accept new pickups."
              />
            </Card>
          ) : open.length ? (
            <TaskList items={open} />
          ) : (
            <Card>
              <EmptyState title="No new pickups right now" description="We’ll notify you as soon as one is ready." />
            </Card>
          )}
        </section>
      )}

      <ActivityCard
        title="Your deliveries over time"
        path="/volunteer"
        activity={activity}
        metric="deliveries"
        metricLabel="Deliveries completed"
        totals={[
          { label: "Deliveries", value: activity.totals.deliveries },
          { label: "Meals delivered", value: activity.totals.mealsDelivered, highlight: true },
        ]}
      />
    </div>
  );
}

function SectionTitle({ title, subtitle, href, linkLabel }: { title: string; subtitle?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-brand-950 sm:text-2xl">{title}</h2>
        {subtitle && <p className="text-sm text-ink-500">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="shrink-0 rounded-full border border-brand-900/10 bg-white px-3.5 py-1.5 text-sm font-semibold text-brand-800 hover:bg-cream-100"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-brand-600 bg-brand-600 text-white" : undefined}>
      <div className="flex flex-col-reverse p-3 sm:p-5">
        <dt className={highlight ? "text-xs font-medium text-brand-100 sm:text-sm" : "text-xs font-medium text-ink-600 sm:text-sm"}>
          {label}
        </dt>
        <dd
          className={
            highlight
              ? "font-display text-2xl font-semibold tabular-nums sm:text-3xl"
              : "font-display text-2xl font-semibold text-brand-950 tabular-nums sm:text-3xl"
          }
        >
          {value}
        </dd>
      </div>
    </Card>
  );
}
