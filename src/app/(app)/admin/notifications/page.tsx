import type { Metadata } from "next";
import { NotificationsPage } from "@/components/notifications-page";
import { requireRole } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Notifications" };

export default async function AdminNotificationsPage({ searchParams }: PageProps<"/admin/notifications">) {
  const user = await requireRole("admin");
  return <NotificationsPage user={user} search={await searchParams} />;
}
