import { Skeleton } from "@/components/ui";
import { getI18n } from "@/lib/i18n-server";

export default async function PortalLoading() {
  const { t } = await getI18n();
  return (
    <div role="status" aria-label={t("Loading…")}>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-2 h-4 w-72" />
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-card" />
        ))}
      </div>
      <Skeleton className="mt-6 h-64 rounded-card" />
    </div>
  );
}
