import { getDb } from "@/db";
import { activityLog } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/dal";
import { EXPORT_DATASETS, parseReportQuery, type ExportDataset } from "@/lib/reports/meta";
import { buildExport } from "@/lib/reports/export";

/** CSV export of one dataset with the report filters (admins only). Each export is written to the activity log. */
export async function GET(request: Request, ctx: RouteContext<"/api/admin/export/[dataset]">) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return new Response("Not found", { status: 404 });
  const { dataset } = await ctx.params;
  if (!(dataset in EXPORT_DATASETS)) return new Response("Not found", { status: 404 });

  const url = new URL(request.url);
  const query = parseReportQuery(url.searchParams);
  const { csv, rows } = await buildExport(dataset as ExportDataset, query);

  const db = await getDb();
  await db.insert(activityLog).values({
    actorId: user.id,
    action: "data_export",
    targetType: "user",
    targetId: user.id,
    note: `${EXPORT_DATASETS[dataset as ExportDataset]} · ${rows} rows${url.search ? ` · ${decodeURIComponent(url.search.slice(1)).slice(0, 200)}` : ""}`,
  });

  const day = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="foodbridge-${dataset}-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
