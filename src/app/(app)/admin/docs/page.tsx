import { requireRole } from "@/lib/auth/dal";
import { readDocs } from "@/lib/docs/service";
import { DocsEditor } from "@/components/docs/docs-editor";
export const dynamic = "force-dynamic";
export default async function DocsAdminPage() {
  await requireRole("admin");
  return <DocsEditor initial={await readDocs()} />;
}
