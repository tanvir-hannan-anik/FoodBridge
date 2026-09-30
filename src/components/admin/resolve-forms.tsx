"use client";

import { Alert, Button, Input, Select } from "@/components/ui";
import { useFormAction } from "@/components/ui/use-form-action";
import { formatDistance } from "@/lib/geo";
import type { FormState } from "@/lib/validation";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

export type VolunteerChoice = { id: string; name: string; area: string | null; available: boolean; activeTasks: number; km: number | null };

function choiceLabel(v: VolunteerChoice) {
  const facts = [v.available ? "available" : "unavailable", formatDistance(v.km) && `${formatDistance(v.km)} away`, v.area, v.activeTasks && `${v.activeTasks} active`];
  return `${v.name} · ${facts.filter(Boolean).join(" · ")}`;
}

/** Admin hands an allocated pickup nobody has taken to a volunteer they picked. */
export function OfferVolunteerForm({ action: serverAction, volunteers }: { action: Action; volunteers: VolunteerChoice[] }) {
  const { state, action, onSubmit, pending } = useFormAction(serverAction);
  if (!volunteers.length) {
    return <p className="text-sm text-ink-600">No verified volunteers yet. Approve one under Users first.</p>;
  }
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-3" noValidate>
      {state?.message && <Alert tone="error">{state.message}</Alert>}
      {state?.success && <Alert tone="success">{state.success}</Alert>}
      <Select
        label="Volunteer"
        name="volunteerId"
        placeholder="Choose a volunteer"
        options={volunteers.map((v) => ({ value: v.id, label: choiceLabel(v) }))}
        hint="They get the task first and can still accept or decline."
        error={state?.errors?.volunteerId}
      />
      <Button type="submit" variant="outline" block loading={pending} className="rounded-full">
        Offer the pickup
      </Button>
    </form>
  );
}

/** Admin records a delivery that happened but was never confirmed in the app. */
export function ConfirmDeliveryForm({ action: serverAction }: { action: Action }) {
  const { state, action, onSubmit, pending } = useFormAction(serverAction);
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
        Mark as delivered
      </Button>
    </form>
  );
}
