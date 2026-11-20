import { isDocsPublic, publicDocs } from "@/lib/docs/model";
import { docsMetrics, readDocs } from "@/lib/docs/service";
export const dynamic = "force-dynamic";
export async function GET() {
  const settings = await readDocs();
  if (!isDocsPublic(settings.content)) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  return Response.json({ ...settings, content: publicDocs(settings.content), metrics: settings.content.showLive ? await docsMetrics() : null }, { headers: { "Cache-Control": "no-store" } });
}
