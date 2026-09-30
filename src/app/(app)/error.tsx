"use client";

import { Button, ButtonLink, Card, ErrorState } from "@/components/ui";

export default function PortalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card>
      <ErrorState
        description="We couldn’t load this page. Your data is safe — please try again."
        action={
          <div className="flex gap-2">
            <Button onClick={reset}>Try again</Button>
            <ButtonLink href="/" variant="outline">
              Go home
            </ButtonLink>
          </div>
        }
      />
    </Card>
  );
}
