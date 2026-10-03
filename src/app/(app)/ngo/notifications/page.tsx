import type { Metadata } from "next";
import { NotificationsPage } from "@/components/notifications-page";
import { requireRole } from "@/lib/auth/dal";
import { getI18n } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Notifications") };
}

export default async function NgoNotificationsPage({ searchParams }: PageProps<"/ngo/notifications">) {
  const user = await requireRole("ngo");
  return <NotificationsPage user={user} search={await searchParams} />;
}
