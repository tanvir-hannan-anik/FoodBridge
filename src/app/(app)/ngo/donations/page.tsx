import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { AvailableList } from "@/components/ngo/available-list";
import { Card, EmptyState, Input, Select } from "@/components/ui";
import { FOOD_CATEGORIES, type FoodCategory } from "@/db/schema";
import { requireRole } from "@/lib/auth/dal";
import { CATEGORY_LABEL, toOptions } from "@/lib/donations/meta";
import { expireOverdueDonations } from "@/lib/donations/service";
import { EXPIRY_FILTERS } from "@/lib/ngo/meta";
import { listAvailableDonations } from "@/lib/ngo/service";
import { getI18n } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Find food") };
}

const CATEGORIES = [{ value: "", label: "All food types" }, ...toOptions(CATEGORY_LABEL)];

export default async function FindFoodPage({ searchParams }: PageProps<"/ngo/donations">) {
  const ngo = await requireRole("ngo");
  const params = await searchParams;
  const str = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim().slice(0, 80) : "");

  const location = str(params.location);
  const category = FOOD_CATEGORIES.includes(str(params.category) as FoodCategory)
    ? (str(params.category) as FoodCategory)
    : undefined;
  const within = EXPIRY_FILTERS.some((f) => f.value && f.value === str(params.within)) ? Number(params.within) : undefined;
  const filtered = Boolean(location || category || within);

  await expireOverdueDonations();
  const items = await listAvailableDonations(ngo.id, { location, category, within });
  const { t } = await getI18n();

  return (
    <>
      <PageHeader
        eyebrow="Find food"
        title="Available donations"
        description="Food that donors have posted and nobody has claimed yet. Soonest-expiring first."
      />

      <Card className="mb-6 p-5 sm:p-6">
        <form method="get" className="grid gap-4 md:grid-cols-[1.3fr_1fr_1fr_auto] md:items-end">
          <Input
            label="Location"
            name="location"
            defaultValue={location}
            placeholder="Area or address, e.g. Mirpur"
          />
          <Select label="Food type" name="category" options={CATEGORIES} defaultValue={category ?? ""} />
          <Select label="Availability" name="within" options={EXPIRY_FILTERS} defaultValue={within ? String(within) : ""} />
          <div className="flex gap-2">
            <button
              type="submit"
              className="h-12 flex-1 rounded-full bg-brand-950 px-6 text-sm font-semibold text-cream-50 hover:bg-brand-800 md:flex-none"
            >
              {t("Apply")}
            </button>
            {filtered && (
              <Link
                href="/ngo/donations"
                className="grid h-12 place-items-center rounded-full border border-brand-900/15 px-5 text-sm font-semibold text-brand-900 hover:bg-cream-100"
              >
                {t("Reset")}
              </Link>
            )}
          </div>
        </form>
        {ngo.area && location.toLowerCase() !== ngo.area.toLowerCase() && (
          <p className="mt-4 text-sm text-ink-600">
            {t("Quick filter:")}{" "}
            <Link
              href={`/ngo/donations?location=${encodeURIComponent(ngo.area)}`}
              className="rounded-full bg-cream-100 px-3 py-1 font-semibold text-brand-800 hover:bg-cream-200"
            >
              {t("My service area")} · {ngo.area}
            </Link>
          </p>
        )}
      </Card>

      <p className="mb-4 text-sm text-ink-500" role="status">
        {t(
          filtered
            ? items.length === 1
              ? "{n} donation available matching your filters"
              : "{n} donations available matching your filters"
            : items.length === 1
              ? "{n} donation available"
              : "{n} donations available",
          { n: items.length },
        )}
      </p>

      {items.length ? (
        <AvailableList items={items} />
      ) : (
        <Card>
          <EmptyState
            title={filtered ? "No donations match these filters" : "No food available right now"}
            description={
              filtered
                ? "Try a wider area or a longer availability window."
                : "New donations appear here as soon as donors post them. You’ll also see them on your dashboard."
            }
            action={
              filtered && (
                <Link href="/ngo/donations" className="font-semibold text-brand-700 hover:underline">
                  {t("Clear filters")}
                </Link>
              )
            }
          />
        </Card>
      )}
    </>
  );
}
