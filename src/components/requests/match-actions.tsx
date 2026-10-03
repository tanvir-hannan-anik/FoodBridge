"use client";

import { acceptMatchAction, cancelMatchAction, skipMatchAction } from "@/app/actions/requests";
import { useI18n } from "@/components/i18n-provider";
import { Alert, Button, SubmitButton, Textarea } from "@/components/ui";
import { useFormAction } from "@/components/ui/use-form-action";

/** Accept or reject a donation the system matched to one of the NGO's food requests. */
export function MatchActions({ requestId, donationId }: { requestId: string; donationId: string }) {
  const { state, action, onSubmit, pending } = useFormAction(acceptMatchAction.bind(null, requestId, donationId));
  const { t } = useI18n();
  return (
    <div className="space-y-3">
      {state?.message && <Alert tone="error">{state.message}</Alert>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <form action={action} onSubmit={onSubmit} className="flex-1">
          <Button type="submit" block loading={pending} className="rounded-full">
            {t("Accept this food")}
          </Button>
        </form>
        <form action={skipMatchAction.bind(null, requestId)} className="sm:w-40">
          <SubmitButton variant="outline" block pendingLabel="Rejecting…" className="rounded-full">
            {t("Reject")}
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}

/** Cancel an allocated match before pickup: the food is released for other NGOs. */
export function CancelMatchForm({ requestId }: { requestId: string }) {
  const { state, action, onSubmit, pending } = useFormAction(cancelMatchAction.bind(null, requestId));
  const { t } = useI18n();
  if (state?.success) return <Alert tone="success">{state.success}</Alert>;
  return (
    <details className="rounded-2xl border border-cream-200 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-ink-700">{t("Can’t receive it? Cancel this match")}</summary>
      <form action={action} onSubmit={onSubmit} className="mt-4 space-y-3" noValidate>
        {state?.message && <Alert tone="error">{state.message}</Alert>}
        <Textarea label="Reason" name="reason" optional rows={2} maxLength={200} placeholder="e.g. Our kitchen is closed tonight" />
        <Button type="submit" variant="danger" block loading={pending} className="rounded-full">
          {t("Cancel match")}
        </Button>
        <p className="text-xs text-ink-500">
          {t("Possible until the volunteer picks the food up. The donor and volunteer are told straight away.")}
        </p>
      </form>
    </details>
  );
}
