import type { Metadata } from "next";
import { NotificationsPage } from "@/components/notifications-page";
import { requireRole } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Notifications" };

export default async function NgoNotificationsPage({ searchParams }: PageProps<"/ngo/notifications">) {
  const user = await requireRole("ngo");
  return <NotificationsPage user={user} search={await searchParams} />;
}
