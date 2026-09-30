import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { TaskList } from "@/components/volunteer/task-list";
import { Card, EmptyState } from "@/components/ui";
import { requireRole } from "@/lib/auth/dal";
import { listVolunteerTasks, sweepVolunteerTasks } from "@/lib/volunteer/service";

export const metadata: Metadata = { title: "My tasks" };

export default async function VolunteerTasksPage() {
  const volunteer = await requireRole("volunteer");
  await sweepVolunteerTasks(volunteer.id);
  const [current, completed] = await Promise.all([
    listVolunteerTasks(volunteer, "current"),
    listVolunteerTasks(volunteer, "completed"),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Volunteer" title="My tasks" description="Pickups you’ve accepted, and your delivery history." />

      <section aria-labelledby="current-heading">
        <h2 id="current-heading" className="mb-3 font-display text-xl font-semibold text-brand-950">
          Current <span className="text-ink-500">({current.length})</span>
        </h2>
        {current.length ? (
          <TaskList items={current} />
        ) : (
          <Card>
            <EmptyState title="Nothing in progress" description="Accept a new pickup from your dashboard." />
          </Card>
        )}
      </section>

      <section aria-labelledby="completed-heading" className="mt-10">
        <h2 id="completed-heading" className="mb-3 font-display text-xl font-semibold text-brand-950">
          Completed <span className="text-ink-500">({completed.length})</span>
        </h2>
        {completed.length ? (
          <TaskList items={completed} />
        ) : (
          <Card>
            <EmptyState title="No deliveries yet" description="Finished deliveries will be listed here." />
          </Card>
        )}
      </section>
    </div>
  );
}
