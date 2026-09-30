import type { Metadata } from "next";
import { NotificationsPage } from "@/components/notifications-page";
import { requireRole } from "@/lib/auth/dal";
import { sweepDonorDonations } from "@/lib/donations/service";

export const metadata: Metadata = { title: "Notifications" };

export default async function DonorNotificationsPage({ searchParams }: PageProps<"/donor/notifications">) {
  const user = await requireRole("donor");
  await sweepDonorDonations(user.id);
  return <NotificationsPage user={user} search={await searchParams} />;
}
