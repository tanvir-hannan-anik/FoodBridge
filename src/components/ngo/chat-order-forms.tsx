"use client";

import { choiceLabel, type VolunteerChoice } from "@/components/admin/resolve-forms";
import { useI18n } from "@/components/i18n-provider";
import { Alert, Button, Select } from "@/components/ui";
import { useFormAction } from "@/components/ui/use-form-action";
import type { FormState } from "@/lib/validation";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/** NGO picks a volunteer for an order that came in over chat. */
export function AssignVolunteerForm({
  action: serverAction,
  volunteers,
  reassign = false,
}: {
  action: Action;
  volunteers: VolunteerChoice[];
  reassign?: boolean;
}) {
  const { state, action, onSubmit, pending } = useFormAction(serverAction);
  const i18n = useI18n();
  const { t } = i18n;
  if (!volunteers.length) {
    return <p className="text-sm text-ink-600">{t("No volunteers are available right now. Try again in a little while.")}</p>;
  }
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-3" noValidate>
      {state?.message && <Alert tone="error">{state.message}</Alert>}
      {state?.success && <Alert tone="success">{state.success}</Alert>}
      <Select
        label={reassign ? "New volunteer" : "Volunteer"}
        name="volunteerId"
        placeholder="Choose a volunteer"
        options={volunteers.map((v) => ({ value: v.id, label: choiceLabel(v, i18n) }))}
        hint="Only verified volunteers who are available right now. Nearest to you first."
        error={state?.errors?.volunteerId}
      />
      <Button type="submit" variant={reassign ? "outline" : "primary"} block loading={pending} className="rounded-full">
        {t(reassign ? "Change volunteer" : "Assign volunteer")}
      </Button>
    </form>
  );
}
