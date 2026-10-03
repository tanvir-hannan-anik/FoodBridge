import type { Metadata } from "next";
import { AssistantFullScreen } from "@/components/assistant/assistant-fullscreen";
import { requireUser } from "@/lib/auth/dal";
import { getI18n } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Assistant") };
}

/** Only same-site paths are accepted as the Back target (no open redirects). */
function safeBack(from: string | string[] | undefined, fallback: string) {
  return typeof from === "string" && from.startsWith("/") && !from.startsWith("//") && !from.startsWith("/assistant") ? from : fallback;
}

export default async function AssistantPage({ searchParams }: PageProps<"/assistant">) {
  const user = await requireUser();
  const { c, from } = await searchParams;
  return <AssistantFullScreen role={user.role} initial={typeof c === "string" ? c : "new"} backHref={safeBack(from, `/${user.role}`)} />;
}
