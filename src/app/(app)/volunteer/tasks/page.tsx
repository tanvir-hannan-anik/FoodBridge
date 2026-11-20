import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ChatOrderList } from "@/components/volunteer/chat-order-list";
import { TaskList } from "@/components/volunteer/task-list";
import { Card, EmptyState } from "@/components/ui";
import { requireRole } from "@/lib/auth/dal";
import { listChatOrdersForVolunteer } from "@/lib/chat-orders/service";
import { listVolunteerTasks, sweepVolunteerTasks } from "@/lib/volunteer/service";
import { getI18n } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("My tasks") };
}

export default async function VolunteerTasksPage() {
  const volunteer = await requireRole("volunteer");
  await sweepVolunteerTasks(volunteer.id);
  const [current, completed, chatOrders] = await Promise.all([
    listVolunteerTasks(volunteer, "current"),
    listVolunteerTasks(volunteer, "completed"),
    listChatOrdersForVolunteer(volunteer.id),
  ]);
  const chatCurrent = chatOrders.filter((o) => o.status !== "DELIVERED").length;
  const { t, number } = await getI18n();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Volunteer" title="My tasks" description="Pickups you’ve accepted, and your delivery history." />

      <section aria-labelledby="current-heading">
        <h2 id="current-heading" className="mb-3 font-display text-xl font-semibold text-brand-950">
          {t("Current")} <span className="text-ink-500">({number(current.length)})</span>
        </h2>
        {current.length ? (
          <TaskList items={current} />
        ) : (
          <Card>
            <EmptyState title="Nothing in progress" description="Accept a new pickup from your dashboard." />
          </Card>
        )}
      </section>

      {chatOrders.length > 0 && (
        <section id="chat-orders" aria-labelledby="chat-heading" className="mt-10 scroll-mt-24">
          <h2 id="chat-heading" className="font-display text-xl font-semibold text-brand-950">
            {t("Chat orders")} <span className="text-ink-500">({number(chatCurrent)})</span>
          </h2>
          <p className="mb-3 text-sm text-ink-600">{t("Food offered over WhatsApp or Messenger that an NGO asked you to collect.")}</p>
          <ChatOrderList items={chatOrders} />
        </section>
      )}

      <section aria-labelledby="completed-heading" className="mt-10">
        <h2 id="completed-heading" className="mb-3 font-display text-xl font-semibold text-brand-950">
          {t("Completed")} <span className="text-ink-500">({number(completed.length)})</span>
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
