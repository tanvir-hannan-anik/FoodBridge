import type { Metadata } from "next";
import Link from "next/link";
import { NeedBoard } from "@/components/donor/need-board";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui";
import { requireRole } from "@/lib/auth/dal";
import { getI18n } from "@/lib/i18n-server";
import { toNeedCard } from "@/lib/requests/meta";
import { listOpenNeedsForDonor } from "@/lib/requests/service";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("NGOs needing food") };
}

/** Every open NGO food request near the donor, with "I can help" on each. */
export default async function DonorNeedsPage() {
  const donor = await requireRole("donor");
  const [needs, { t }] = await Promise.all([listOpenNeedsForDonor(donor, 60), getI18n()]);
  return (
    <>
      <PageHeader
        eyebrow="NGO requests"
        title="NGOs needing food"
        description="Verified NGOs near you post what they need. Reply if you can help, or post the food for their request: the NGO confirms it and a volunteer collects it from you."
      />
      {needs.length ? (
        <NeedBoard needs={needs.map(toNeedCard)} />
      ) : (
        <EmptyState
          title="No open requests near you right now"
          description="We’ll send you an alert when an NGO nearby needs food, so you don’t have to keep checking."
          action={
            <Link
              href="/donor/donate"
              className="inline-flex h-11 items-center rounded-full bg-brand-600 px-6 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {t("Donate food")}
            </Link>
          }
        />
      )}
    </>
  );
}
