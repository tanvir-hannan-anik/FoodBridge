"use client";

import { useI18n } from "@/components/i18n-provider";
import { Alert, Button, Input } from "@/components/ui";
import { useFormAction } from "@/components/ui/use-form-action";
import type { FormState } from "@/lib/validation";

/** Records how many meals were actually served and completes the donation. */
export function CompleteForm({
  action: serverAction,
  defaultMeals,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultMeals: number;
}) {
  const { state, action, onSubmit, pending } = useFormAction(serverAction);
  const { t } = useI18n();
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4" noValidate>
      {state?.message && <Alert tone="error">{state.message}</Alert>}
      {state?.success && <Alert tone="success">{state.success}</Alert>}
      <Input
        label="Meals served"
        name="mealsServed"
        type="number"
        inputMode="numeric"
        min="1"
        step="1"
        defaultValue={defaultMeals}
        hint="Roughly how many people ate from this donation."
        error={state?.errors?.mealsServed}
      />
      <Button type="submit" block loading={pending} className="rounded-full">
        {t("Mark as distributed")}
      </Button>
    </form>
  );
}
