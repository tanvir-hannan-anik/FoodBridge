import { requireRole } from "@/lib/auth/dal";
import { readDocs, docsMetrics } from "@/lib/docs/service";
import { DocsView } from "@/components/docs/docs-view";
export const dynamic = "force-dynamic";
export default async function DocsPreviewPage() {
  await requireRole("admin");
  const settings = await readDocs();
  return <DocsView preview initial={{ ...settings, metrics: settings.content.showLive ? await docsMetrics() : null }} />;
}
