import { notFound } from "next/navigation";
import { DocsView } from "@/components/docs/docs-view";
import { readDocs, docsMetrics } from "@/lib/docs/service";
import { isDocsPublic, publicDocs } from "@/lib/docs/model";
export const dynamic = "force-dynamic";
export const metadata = { title: "FoodBridge | Product & engineering", robots: { index: false, follow: false } };
export default async function DocsPage() {
  const settings = await readDocs();
  if (!isDocsPublic(settings.content)) notFound();
  return <DocsView initial={{ ...settings, content: publicDocs(settings.content), metrics: settings.content.showLive ? await docsMetrics() : null }} />;
}
