import type { Metadata } from "next";
import { RoleMapPage } from "@/components/map/role-map-page";
import { requireRole } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Map" };

export default async function VolunteerMapPage() {
  const user = await requireRole("volunteer");
  return <RoleMapPage user={user} />;
}
