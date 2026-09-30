import type { Metadata } from "next";
import { NotificationsPage } from "@/components/notifications-page";
import { requireRole } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Notifications" };

export default async function VolunteerNotificationsPage({ searchParams }: PageProps<"/volunteer/notifications">) {
  const user = await requireRole("volunteer");
  return <NotificationsPage user={user} search={await searchParams} />;
}
