import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createNeedAction } from "@/app/actions/requests";
import { PageHeader } from "@/components/layout/page-header";
import { NeedForm } from "@/components/requests/need-form";
import { Card, CardBody } from "@/components/ui";
import { decodeDraft, needDraftSchema } from "@/lib/ai/schemas";
import { requireRole } from "@/lib/auth/dal";
import { getI18n } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("New food request") };
}

/** ISO time `hours` from now (for an assistant draft's "needed in N hours"). */
function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 3_600_000).toISOString();
}

export default async function NewNeedPage({ searchParams }: PageProps<"/ngo/requests/new">) {
  const ngo = await requireRole("ngo");
  if (ngo.status !== "active") redirect("/ngo/requests");
  const draft = decodeDraft(needDraftSchema, (await searchParams).draft);
  const { t } = await getI18n();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/ngo/requests" className="text-sm font-medium text-ink-500 hover:text-brand-800">
        ← {t("Food requests")}
      </Link>
      <div className="mt-4">
        <PageHeader
          eyebrow="New request"
          title="What food do you need?"
          description="We’ll match available donations by food type, quantity, location and freshness. You confirm before anything is sent."
        />
      </div>
      <Card>
        <CardBody>
          <NeedForm
            action={createNeedAction}
            submitLabel="Post request"
            defaults={{
              category: draft?.category ?? null,
              foodType: draft?.foodType ?? null,
              quantity: draft?.quantity ?? null,
              unit: draft?.unit ?? "plates",
              people: draft?.people ?? ngo.capacity,
              area: draft?.area ?? ngo.area ?? "",
              address: draft?.address ?? ngo.address,
              point: ngo.lat !== null && ngo.lng !== null ? { lat: ngo.lat, lng: ngo.lng } : null,
              neededBy: draft?.neededInHours ? hoursFromNow(draft.neededInHours) : "",
              missing: draft?.missing,
              notes: draft?.notes ?? null,
            }}
          />
        </CardBody>
      </Card>
    </div>
  );
}
