import type { Metadata } from "next";
import { RoleMapPage } from "@/components/map/role-map-page";
import { requireRole } from "@/lib/auth/dal";
import { getI18n } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Map") };
}

export default async function VolunteerMapPage() {
  const user = await requireRole("volunteer");
  return <RoleMapPage user={user} />;
}
