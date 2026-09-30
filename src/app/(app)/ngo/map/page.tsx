import type { Metadata } from "next";
import { RoleMapPage } from "@/components/map/role-map-page";
import { requireRole } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Map" };

export default async function NgoMapPage() {
  const user = await requireRole("ngo");
  return <RoleMapPage user={user} />;
}
