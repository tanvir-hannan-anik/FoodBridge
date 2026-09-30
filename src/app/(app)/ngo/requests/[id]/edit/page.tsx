import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateNeedAction } from "@/app/actions/requests";
import { PageHeader } from "@/components/layout/page-header";
import { NeedForm } from "@/components/requests/need-form";
import { Card, CardBody } from "@/components/ui";
import { requireRole } from "@/lib/auth/dal";
import { getNeed } from "@/lib/requests/service";

export const metadata: Metadata = { title: "Edit food request" };

export default async function EditNeedPage({ params }: PageProps<"/ngo/requests/[id]/edit">) {
  const ngo = await requireRole("ngo");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const need = await getNeed(ngo.id, id);
  if (!need) notFound();
  if (!need.editable) redirect(`/ngo/requests/${id}`);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/ngo/requests/${id}`} className="text-sm font-medium text-ink-500 hover:text-brand-800">
        ← Back to request
      </Link>
      <div className="mt-4">
        <PageHeader eyebrow="Edit request" title="Update what you need" description="Saving withdraws any match waiting for you and looks again." />
      </div>
      <Card>
        <CardBody>
          <NeedForm
            action={updateNeedAction.bind(null, id)}
            submitLabel="Save changes"
            defaults={{
              category: need.category,
              foodType: need.foodType,
              quantity: need.quantity,
              unit: need.unit,
              people: need.people,
              area: need.area,
              address: need.address,
              point: need.lat !== null && need.lng !== null ? { lat: need.lat, lng: need.lng } : null,
              neededBy: need.neededBy.toISOString(),
              notes: need.notes,
            }}
          />
        </CardBody>
      </Card>
    </div>
  );
}
