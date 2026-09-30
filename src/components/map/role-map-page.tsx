import { PageHeader } from "@/components/layout/page-header";
import { Alert, Card, CardBody } from "@/components/ui";
import type { User } from "@/db/schema";
import { ROLE_LABEL } from "@/lib/auth/roles";
import { getOverviewMap } from "@/lib/location/overview";
import { OverviewMap } from "./overview-map";

const COPY: Record<User["role"], { title: string; description: string }> = {
  donor: { title: "Map", description: "Your food waiting for pickup, NGOs near you, and deliveries on the way." },
  ngo: { title: "Map", description: "Donors, available food and volunteers around you, and deliveries coming to you." },
  volunteer: { title: "Map", description: "Donor pickup points for your tasks and open pickups, and where each one is delivered." },
  admin: { title: "Map", description: "Every NGO, volunteer and donor with a location, available food and active deliveries." },
};

/** Shared "Map" page: each portal calls requireRole() first, then renders this. */
export async function RoleMapPage({ user }: { user: User }) {
  const data = await getOverviewMap(user);
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow={ROLE_LABEL[user.role]} {...COPY[user.role]} />
      {user.role === "volunteer" && user.status !== "active" && (
        <Alert tone="warning" className="mb-4">
          Pickup locations appear once your account is verified.
        </Alert>
      )}
      <Card>
        <CardBody>
          <OverviewMap data={data} />
        </CardBody>
      </Card>
    </div>
  );
}
