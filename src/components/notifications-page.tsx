import type { User } from "@/db/schema";
import { ROLE_HOME } from "@/lib/auth/roles";
import { NOTIFICATION_CATEGORIES, type NotificationCategory } from "@/lib/notifications/meta";
import { countUnread, listNotifications } from "@/lib/notifications/service";
import { NotificationsView } from "./notifications-view";

type Search = Record<string, string | string[] | undefined>;

/** The notifications page for any role: reads the filters from the URL. */
export async function NotificationsPage({ user, search }: { user: User; search: Search }) {
  const unread = search.show === "unread";
  const category = NOTIFICATION_CATEGORIES.includes(search.type as NotificationCategory) ? (search.type as NotificationCategory) : null;
  const [items, unreadTotal] = await Promise.all([
    listNotifications(user.id, { unreadOnly: unread, category: category ?? undefined }),
    countUnread(user.id),
  ]);
  return (
    <NotificationsView
      items={items}
      role={user.role}
      unreadTotal={unreadTotal}
      filter={{ unread, category }}
      basePath={`${ROLE_HOME[user.role]}/notifications`}
    />
  );
}
