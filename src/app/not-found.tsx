import { ButtonLink, EmptyState } from "@/components/ui";
import { getI18n } from "@/lib/i18n-server";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <main id="main" className="grid flex-1 place-items-center px-4">
      <EmptyState
        title="Page not found"
        description="The page you’re looking for doesn’t exist or you don’t have access to it."
        action={<ButtonLink href="/">{t("Back to home")}</ButtonLink>}
      />
    </main>
  );
}
