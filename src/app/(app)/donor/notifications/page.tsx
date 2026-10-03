import type { Metadata } from "next";
import { NotificationsPage } from "@/components/notifications-page";
import { requireRole } from "@/lib/auth/dal";
import { sweepDonorDonations } from "@/lib/donations/service";
import { getI18n } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Notifications") };
}

export default async function DonorNotificationsPage({ searchParams }: PageProps<"/donor/notifications">) {
  const user = await requireRole("donor");
  await sweepDonorDonations(user.id);
  return <NotificationsPage user={user} search={await searchParams} />;
}
