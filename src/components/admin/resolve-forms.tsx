"use client";

import { useI18n } from "@/components/i18n-provider";
import { Alert, Button, Input, Select } from "@/components/ui";
import { useFormAction } from "@/components/ui/use-form-action";
import { formatDistance } from "@/lib/geo";
import type { I18n } from "@/lib/i18n";
import type { FormState } from "@/lib/validation";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

export type VolunteerChoice = { id: string; name: string; area: string | null; available: boolean; activeTasks: number; km: number | null };

function choiceLabel(v: VolunteerChoice, { t }: I18n) {
  const away = formatDistance(v.km);
  const facts = [
    t(v.available ? "available" : "unavailable"),
    away && t("{d} away", { d: t(away) }),
    v.area,
    v.activeTasks && t("{n} active", { n: v.activeTasks }),
  ];
  return `${v.name} · ${facts.filter(Boolean).join(" · ")}`;
}

/** Admin hands an allocated pickup nobody has taken to a volunteer they picked. */
export function OfferVolunteerForm({ action: serverAction, volunteers }: { action: Action; volunteers: VolunteerChoice[] }) {
  const { state, action, onSubmit, pending } = useFormAction(serverAction);
  const i18n = useI18n();
  const { t } = i18n;
  if (!volunteers.length) {
    return <p className="text-sm text-ink-600">{t("No verified volunteers yet. Approve one under Users first.")}</p>;
  }
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-3" noValidate>
      {state?.message && <Alert tone="error">{state.message}</Alert>}
      {state?.success && <Alert tone="success">{state.success}</Alert>}
      <Select
        label="Volunteer"
        name="volunteerId"
        placeholder="Choose a volunteer"
        options={volunteers.map((v) => ({ value: v.id, label: choiceLabel(v, i18n) }))}
        hint="They get the task first and can still accept or decline."
        error={state?.errors?.volunteerId}
      />
      <Button type="submit" variant="outline" block loading={pending} className="rounded-full">
        {t("Offer the pickup")}
      </Button>
    </form>
  );
}

/** Admin records a delivery that happened but was never confirmed in the app. */
export function ConfirmDeliveryForm({ action: serverAction }: { action: Action }) {
  const { state, action, onSubmit, pending } = useFormAction(serverAction);
  const { t } = useI18n();
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-3" noValidate>
      {state?.message && <Alert tone="error">{state.message}</Alert>}
      {state?.success && <Alert tone="success">{state.success}</Alert>}
      <Input
        label="How do you know it arrived?"
        name="reason"
        maxLength={200}
        placeholder="e.g. NGO called to confirm"
        hint="Shown in the donation’s timeline."
        error={state?.errors?.reason}
      />
      <Button type="submit" variant="outline" block loading={pending} className="rounded-full">
        {t("Mark as delivered")}
      </Button>
    </form>
  );
}
