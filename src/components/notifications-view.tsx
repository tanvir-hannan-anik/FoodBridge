import Link from "next/link";
import { markNotificationsRead, toggleNotificationRead } from "@/app/actions/notifications";
import { PageHeader } from "@/components/layout/page-header";
import { Card, EmptyState, SubmitButton } from "@/components/ui";
import type { Notification, NotificationType, Role } from "@/db/schema";
import { CATEGORY_LABEL, NOTIFICATION_CATEGORIES, NOTIFICATION_CATEGORY, notificationHref, type NotificationCategory } from "@/lib/notifications/meta";
import { getI18n } from "@/lib/i18n-server";
import { cn } from "@/lib/utils";

const CHECK = "m5 12.5 4.5 4.5L19 7.5";
const STYLE: Record<NotificationType, { tone: string; icon: string }> = {
  donation_created: { tone: "bg-cream-200 text-brand-900", icon: "M12 5v14M5 12h14" },
  matched: {
    tone: "bg-sky-50 text-sky-700",
    icon: "m11 17 2 2a1.4 1.4 0 0 0 2-2m-1-3 2.5 2.5a1.4 1.4 0 0 0 2-2l-3.9-3.9a3 3 0 0 0-4.2 0l-.9.9a1.4 1.4 0 0 1-2-2l2.8-2.8a5 5 0 0 1 6-.8l.5.3a3 3 0 0 0 2 .4H21M21 4v10h-2M3 4v10h2l4.5 4.5a1.4 1.4 0 0 0 2-2M3 5h7",
  },
  volunteer_assigned: {
    tone: "bg-violet-50 text-violet-700",
    icon: "M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM17 8v6M20 11h-6",
  },
  picked_up: {
    tone: "bg-brand-50 text-brand-700",
    icon: "M5.5 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18.5 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12 17v-4l-3-3 4-3 2 3h3",
  },
  delivered: { tone: "bg-brand-50 text-brand-700", icon: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" },
  completed: { tone: "bg-brand-600 text-white", icon: CHECK },
  cancelled: { tone: "bg-ink-100 text-ink-600", icon: "M6 6l12 12M18 6 6 18" },
  expired: { tone: "bg-red-50 text-red-600", icon: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
  request_submitted: { tone: "bg-cream-200 text-brand-900", icon: "M22 2 11 13M22 2l-7 20-4-9-9-4Z" },
  request_received: {
    tone: "bg-accent-100 text-accent-700",
    icon: "M3 7.5 12 3l9 4.5M3 7.5v9L12 21l9-4.5v-9M3 7.5 12 12l9-4.5M12 12v9",
  },
  request_accepted: { tone: "bg-brand-100 text-brand-700", icon: CHECK },
  request_declined: { tone: "bg-ink-100 text-ink-600", icon: "M6 6l12 12M18 6 6 18" },
  account_verified: {
    tone: "bg-brand-600 text-white",
    icon: "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6ZM8.5 12l2.5 2.5 4.5-5",
  },
  request_matched: {
    tone: "bg-sky-50 text-sky-700",
    icon: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-3.5-3.5M8 11l2 2 4-4",
  },
  task_available: {
    tone: "bg-accent-100 text-accent-700",
    icon: "M5.5 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18.5 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12 17v-4l-3-3 4-3 2 3h3",
  },
  task_accepted: { tone: "bg-violet-50 text-violet-700", icon: CHECK },
  task_assigned: {
    tone: "bg-accent-100 text-accent-700",
    icon: "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21ZM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  },
  task_declined: { tone: "bg-ink-100 text-ink-600", icon: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
  in_transit: {
    tone: "bg-brand-50 text-brand-700",
    icon: "M3 7h11v9H3ZM14 10h4l3 3v3h-7M7.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  },
  partially_allocated: { tone: "bg-sky-50 text-sky-700", icon: "M12 3v18M3 12h7m4 0h7M5 7l-2 5 2 5M19 7l2 5-2 5" },
  match_cancelled: { tone: "bg-ink-100 text-ink-600", icon: "M6 6l12 12M18 6 6 18" },
  safety_review: { tone: "bg-red-50 text-red-600", icon: "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6ZM12 9v4m0 3h.01" },
  admin_alert: {
    tone: "bg-red-50 text-red-600",
    icon: "M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  },
  pickup_reminder: { tone: "bg-accent-100 text-accent-700", icon: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
  need_posted: {
    tone: "bg-accent-100 text-accent-700",
    icon: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1ZM12 17s-3-1.8-3-4a1.8 1.8 0 0 1 3-1.2 1.8 1.8 0 0 1 3 1.2c0 2.2-3 4-3 4Z",
  },
  need_response: {
    tone: "bg-brand-100 text-brand-700",
    icon: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12ZM8.5 12h.01M12 12h.01M15.5 12h.01",
  },
  expiry_warning: {
    tone: "bg-accent-100 text-accent-700",
    icon: "M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  },
};

type Filter = { unread: boolean; category: NotificationCategory | null };

function filterHref(base: string, f: Filter) {
  const q = new URLSearchParams();
  if (f.unread) q.set("show", "unread");
  if (f.category) q.set("type", f.category);
  return q.size ? `${base}?${q}` : base;
}

/**
 * Notification list shared by all portals: filters (all / unread, by kind), read ↔ unread per item,
 * and each item opens the donation, request or task it's about (marking it read).
 */
export async function NotificationsView({
  items,
  role,
  unreadTotal,
  filter,
  basePath,
}: {
  items: Notification[];
  role: Role;
  unreadTotal: number;
  filter: Filter;
  basePath: string;
}) {
  const { t, relative, number } = await getI18n();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Updates"
        title="Notifications"
        description={
          unreadTotal
            ? t(unreadTotal === 1 ? "You have {n} unread update." : "You have {n} unread updates.", { n: unreadTotal })
            : "You’re all caught up."
        }
        action={
          unreadTotal > 0 && (
            <form action={markNotificationsRead}>
              <SubmitButton variant="outline" className="rounded-full">
                {t("Mark all as read")}
              </SubmitButton>
            </form>
          )
        }
      />

      <nav aria-label={t("Filter notifications")} className="mb-4 flex flex-wrap gap-2">
        <Chip href={filterHref(basePath, { ...filter, unread: false })} active={!filter.unread}>
          {t("All")}
        </Chip>
        <Chip href={filterHref(basePath, { ...filter, unread: true })} active={filter.unread}>
          {t("Unread")}
          {unreadTotal ? ` (${number(unreadTotal)})` : ""}
        </Chip>
        <span aria-hidden className="mx-1 w-px bg-cream-300" />
        <Chip href={filterHref(basePath, { ...filter, category: null })} active={!filter.category}>
          {t("Every kind")}
        </Chip>
        {NOTIFICATION_CATEGORIES.map((c) => (
          <Chip key={c} href={filterHref(basePath, { ...filter, category: c })} active={filter.category === c}>
            {t(CATEGORY_LABEL[c])}
          </Chip>
        ))}
      </nav>

      <Card className="overflow-hidden">
        {items.length ? (
          <ul className="divide-y divide-cream-200">
            {items.map((n) => {
              const style = STYLE[n.type];
              const href = notificationHref(role, n);
              const body = (
                <>
                  <span aria-hidden className={cn("grid size-10 shrink-0 place-items-center rounded-full", style.tone)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                      <path d={style.icon} />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm", n.readAt ? "text-ink-700" : "font-semibold text-brand-950")}>
                      {t(n.message)}
                      {!n.readAt && <span className="sr-only"> {t("(unread)")}</span>}
                    </p>
                    <p className="mt-1 text-xs text-ink-500">
                      {t(CATEGORY_LABEL[NOTIFICATION_CATEGORY[n.type]])} · {relative(n.createdAt)}
                    </p>
                  </div>
                </>
              );
              return (
                <li key={n.id} className={cn("relative flex items-start", !n.readAt && "bg-accent-50/60")}>
                  {!n.readAt && <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-accent-400" />}
                  {href ? (
                    <a href={`/api/notifications/${n.id}/open`} className="flex min-w-0 flex-1 items-start gap-4 py-4 pl-5 hover:bg-cream-50 sm:pl-6">
                      {body}
                    </a>
                  ) : (
                    <div className="flex min-w-0 flex-1 items-start gap-4 py-4 pl-5 sm:pl-6">{body}</div>
                  )}
                  <form action={toggleNotificationRead.bind(null, n.id, !n.readAt)} className="shrink-0 self-center px-3 sm:px-4">
                    <button
                      type="submit"
                      className="rounded-full px-2.5 py-1.5 text-xs font-semibold text-ink-500 hover:bg-cream-100 hover:text-brand-800"
                      aria-label={t(n.readAt ? "Mark as unread" : "Mark as read")}
                    >
                      {t(n.readAt ? "Mark unread" : "Mark read")}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            title={filter.unread || filter.category ? "Nothing here" : "No notifications yet"}
            description={filter.unread || filter.category ? "Try another filter." : "Updates about your food, requests and deliveries will appear here."}
          />
        )}
      </Card>
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold",
        active ? "border-brand-600 bg-brand-50 text-brand-900" : "border-cream-300 bg-white text-ink-600 hover:bg-cream-100",
      )}
    >
      {children}
    </Link>
  );
}
