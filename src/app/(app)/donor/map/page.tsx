import type { Metadata } from "next";
import { RoleMapPage } from "@/components/map/role-map-page";
import { requireRole } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Map" };

export default async function DonorMapPage() {
  const user = await requireRole("donor");
  return <RoleMapPage user={user} />;
}
