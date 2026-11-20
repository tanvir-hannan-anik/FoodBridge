import type { Metadata } from "next";
import Link from "next/link";
import {
  assignChatOrderAction,
  receiveChatOrderAction,
  refreshChatOrdersAction,
  unassignChatOrderAction,
} from "@/app/actions/chat-orders";
import { ChatOrderCard } from "@/components/chat-orders/chat-order-card";
import { PageHeader } from "@/components/layout/page-header";
import { AssignVolunteerForm } from "@/components/ngo/chat-order-forms";
import { Alert, Card, EmptyState, SubmitButton } from "@/components/ui";
import { requireRole } from "@/lib/auth/dal";
import { listChatOrdersForNgo, listChatVolunteerChoices, syncChatOrders } from "@/lib/chat-orders/service";
import { getI18n } from "@/lib/i18n-server";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Chat orders") };
}

const TABS = ["offers", "mine", "requests"] as const;
type Tab = (typeof TABS)[number];

export default async function NgoChatOrdersPage({ searchParams }: PageProps<"/ngo/chat-orders">) {
  const ngo = await requireRole("ngo");
  const { tab: raw } = await searchParams;
  const tab: Tab = TABS.includes(raw as Tab) ? (raw as Tab) : "offers";
  const verified = ngo.status === "active";

  const sync = await syncChatOrders();
  const [{ waiting, mine, requests }, volunteers] = await Promise.all([
    listChatOrdersForNgo(ngo.id),
    verified ? listChatVolunteerChoices(ngo) : Promise.resolve([]),
  ]);
  const active = mine.filter((o) => o.status !== "DELIVERED");
  const openRequests = requests.filter((o) => o.status === "NEW");

  const { t, number, dateTime, relative } = await getI18n();
  const tabs: { value: Tab; label: string; count: number }[] = [
    { value: "offers", label: "Waiting offers", count: waiting.length },
    { value: "mine", label: "Assigned by you", count: active.length },
    { value: "requests", label: "Requests over chat", count: openRequests.length },
  ];

  return (
    <>
      <PageHeader
        eyebrow="WhatsApp & Messenger"
        title="Chat orders"
        description="Food offers and requests that came in over chat. Assign an offer to a volunteer and they’ll bring it to you."
        action={
          sync.configured && (
            <form action={refreshChatOrdersAction}>
              <SubmitButton variant="outline" pendingLabel="Checking…" className="h-12 rounded-full px-5">
                Check for new messages
              </SubmitButton>
            </form>
          )
        }
      />

      {!sync.configured && (
        <Alert tone="warning" title="Chat inbox not connected" className="mb-6">
          {t("Chat orders appear here once the Supabase inbox is connected (SUPABASE_DB_URL).")}
        </Alert>
      )}
      {sync.configured && !sync.ok && (
        <Alert tone="warning" title="Couldn’t reach the chat inbox" className="mb-6">
          {sync.syncedAt
            ? t("Showing what we had at {time}. We’ll try again shortly.", { time: dateTime(sync.syncedAt) })
            : t("Showing the last copy we saved. We’ll try again shortly.")}
        </Alert>
      )}
      {!verified && (
        <Alert tone="warning" title="Verification pending" className="mb-6">
          {t("You can assign chat orders to volunteers once our team has verified your NGO.")}
        </Alert>
      )}

      <Card className="mb-6 overflow-hidden">
        <nav aria-label={t("Chat orders")} className="flex gap-1 overflow-x-auto bg-cream-50 px-4 py-3 [scrollbar-width:none] sm:px-6">
          {tabs.map((item) => {
            const current = tab === item.value;
            return (
              <Link
                key={item.value}
                href={item.value === "offers" ? "/ngo/chat-orders" : `/ngo/chat-orders?tab=${item.value}`}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold",
                  current ? "border-brand-950 bg-brand-950 text-cream-50" : "border-brand-900/10 bg-white text-ink-600 hover:bg-cream-100",
                )}
              >
                {t(item.label)}
                <span className={cn("rounded-full px-1.5 text-xs tabular-nums", current ? "bg-accent-400 text-brand-950" : "bg-cream-200 text-ink-600")}>
                  {number(item.count)}
                </span>
              </Link>
            );
          })}
        </nav>
        {sync.syncedAt && (
          <p className="border-t border-cream-200 px-4 py-2 text-xs text-ink-500 sm:px-6">
            {t("Last checked {time}.", { time: relative(sync.syncedAt) })}
          </p>
        )}
      </Card>

      {tab === "offers" && (
        <section aria-label={t("Waiting offers")} className="space-y-4">
          {waiting.length ? (
            waiting.map((o) => (
              <ChatOrderCard key={o.id} order={o}>
                {verified ? (
                  <AssignVolunteerForm action={assignChatOrderAction.bind(null, o.id)} volunteers={volunteers} />
                ) : (
                  <p className="text-sm text-ink-600">{t("You can assign chat orders to volunteers once our team has verified your NGO.")}</p>
                )}
              </ChatOrderCard>
            ))
          ) : (
            <Card>
              <EmptyState title="No food offers waiting" description="When a shop offers food over WhatsApp or Messenger, it appears here." />
            </Card>
          )}
        </section>
      )}

      {tab === "mine" && (
        <section aria-label={t("Assigned by you")} className="space-y-4">
          {mine.length ? (
            mine.map((o) => (
              <ChatOrderCard
                key={o.id}
                order={o}
                footer={
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium text-ink-500">{t("Volunteer")}</dt>
                      <dd className="text-ink-800">
                        {o.volunteerName ?? t("No volunteer")}
                        {o.volunteerPhone && (
                          <>
                            {" · "}
                            <a href={`tel:${o.volunteerPhone.replace(/[^\d+]/g, "")}`} className="font-semibold text-brand-700 hover:underline">
                              {o.volunteerPhone}
                            </a>
                          </>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-ink-500">{t("Progress")}</dt>
                      <dd className="text-ink-800">
                        {o.deliveredAt
                          ? t("Delivered {time}", { time: dateTime(o.deliveredAt) })
                          : o.pickedUpAt
                            ? t("Picked up {time}", { time: dateTime(o.pickedUpAt) })
                            : o.assignedAt && t("Assigned {time}", { time: dateTime(o.assignedAt) })}
                      </dd>
                    </div>
                  </dl>
                }
              >
                {verified && o.status === "ASSIGNED" && (
                  <div className="space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <form action={receiveChatOrderAction.bind(null, o.id)}>
                        <SubmitButton variant="secondary" block pendingLabel="Saving…" className="rounded-full px-6">
                          Mark received
                        </SubmitButton>
                      </form>
                      <form action={unassignChatOrderAction.bind(null, o.id)}>
                        <SubmitButton variant="ghost" block pendingLabel="Cancelling…" className="rounded-full px-6 text-red-700 hover:bg-red-50">
                          Cancel assignment
                        </SubmitButton>
                      </form>
                    </div>
                    <details className="group rounded-field border border-cream-200 bg-cream-50 px-4 py-3">
                      <summary className="cursor-pointer text-sm font-semibold text-brand-800">{t("Change volunteer")}</summary>
                      <div className="mt-3">
                        <AssignVolunteerForm
                          action={assignChatOrderAction.bind(null, o.id)}
                          volunteers={volunteers.filter((v) => v.id !== o.volunteerId)}
                          reassign
                        />
                      </div>
                    </details>
                  </div>
                )}
                {verified && o.status === "PICKED_UP" && (
                  <form action={receiveChatOrderAction.bind(null, o.id)}>
                    <SubmitButton block pendingLabel="Saving…" className="rounded-full">
                      Mark received
                    </SubmitButton>
                  </form>
                )}
              </ChatOrderCard>
            ))
          ) : (
            <Card>
              <EmptyState title="Nothing assigned yet" description="Offers you assign to a volunteer are tracked here until they reach you." />
            </Card>
          )}
        </section>
      )}

      {tab === "requests" && (
        <section aria-label={t("Requests over chat")} className="space-y-4">
          <p className="text-sm text-ink-600">{t("Food requests NGOs sent over chat. Call them if you can help.")}</p>
          {requests.length ? (
            requests.map((o) => <ChatOrderCard key={o.id} order={o} />)
          ) : (
            <Card>
              <EmptyState title="No requests over chat yet" description="When an NGO asks for food over WhatsApp or Messenger, it appears here." />
            </Card>
          )}
        </section>
      )}
    </>
  );
}
