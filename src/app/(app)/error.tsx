"use client";

import { useI18n } from "@/components/i18n-provider";
import { Button, ButtonLink, Card, ErrorState } from "@/components/ui";

export default function PortalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  return (
    <Card>
      <ErrorState
        description="We couldn’t load this page. Your data is safe — please try again."
        action={
          <div className="flex gap-2">
            <Button onClick={reset}>{t("Try again")}</Button>
            <ButtonLink href="/" variant="outline">
              {t("Go home")}
            </ButtonLink>
          </div>
        }
      />
    </Card>
  );
}
