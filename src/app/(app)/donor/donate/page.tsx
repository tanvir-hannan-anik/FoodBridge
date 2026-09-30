import type { Metadata } from "next";
import Link from "next/link";
import { DonationForm } from "@/components/donor/donation-form";
import { PageHeader } from "@/components/layout/page-header";
import { decodeDraft, donationDraftSchema } from "@/lib/ai/schemas";
import { requireRole } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Donate food" };

const NEXT_STEPS = [
  { title: "NGOs nearby are notified", text: "Verified NGOs see your donation right away." },
  { title: "An NGO accepts", text: "You get a notification with their name and phone." },
  { title: "A volunteer picks it up", text: "They arrive at your pickup time and address." },
  { title: "Meals are served", text: "Your dashboard shows the meals you saved." },
];

export default async function DonatePage({ searchParams }: PageProps<"/donor/donate">) {
  const donor = await requireRole("donor");
  return (
    <>
      <Link href="/donor" className="text-sm font-medium text-ink-500 hover:text-brand-800">
        ← Back to dashboard
      </Link>
      <div className="mt-4">
        <PageHeader
          eyebrow="New donation"
          title="Donate food"
          description="Tell us what you have. It takes about a minute, and a nearby NGO is notified right away."
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
        <DonationForm
          defaults={{
            draft: decodeDraft(donationDraftSchema, (await searchParams).draft),
            contactName: donor.name,
            contactPhone: donor.phone,
            pickupAddress: donor.address ?? "",
            point: donor.lat !== null && donor.lng !== null ? { lat: donor.lat, lng: donor.lng } : null,
          }}
        />

        <aside className="space-y-6 lg:sticky lg:top-24">
          <section className="grain relative overflow-hidden rounded-card bg-brand-950 p-6 text-cream-50">
            <h2 className="font-display text-xl font-semibold">What happens next</h2>
            <ol className="mt-5 space-y-5">
              {NEXT_STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-400 text-xs font-bold text-brand-950">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{s.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-brand-200">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-card border border-accent-100 bg-accent-50 p-6">
            <h2 className="font-display text-lg font-semibold text-brand-950">Tips for a quick match</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink-700 marker:text-accent-500">
              <li>Be specific: “Chicken biryani”, not just “food”.</li>
              <li>Give a realistic best-before time.</li>
              <li>A photo helps NGOs decide faster.</li>
              <li>Keep your phone nearby for the pickup call.</li>
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
