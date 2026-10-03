"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Alert, Button, Input, Select, Textarea } from "@/components/ui";
import { useFormAction } from "@/components/ui/use-form-action";
import type { Unit } from "@/db/schema";
import { UNIT_LABEL, toOptions } from "@/lib/donations/meta";
import type { FormState } from "@/lib/validation";

const UNITS = toOptions(UNIT_LABEL);

function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type Values = {
  foodType: string;
  quantity: number;
  unit: Unit;
  pickupAt: string;
  expiresAt: string;
  pickupAddress: string;
  contactName: string;
  contactPhone: string;
  instructions: string | null;
};

/** Admin correction of a donation's details (not its status). */
export function DonationEditForm({
  action: serverAction,
  values,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  values: Values;
}) {
  const { state, action, onSubmit, pending } = useFormAction(serverAction);
  const { t } = useI18n();
  const e = state?.errors;
  const [times, setTimes] = useState({ pickupAt: "", expiresAt: "", tzOffset: "0" });
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- device timezone is only known on the client
    setTimes({
      pickupAt: toLocalInput(new Date(values.pickupAt)),
      expiresAt: toLocalInput(new Date(values.expiresAt)),
      tzOffset: String(new Date().getTimezoneOffset()),
    });
  }, [values.pickupAt, values.expiresAt]);

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4" noValidate>
      {state?.message && <Alert tone="error">{state.message}</Alert>}
      {state?.success && <Alert tone="success">{state.success}</Alert>}
      <input type="hidden" name="tzOffset" value={times.tzOffset} />
      <Input label="Food" name="foodType" defaultValue={values.foodType} error={e?.foodType} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Quantity" name="quantity" type="number" step="any" min="0.1" defaultValue={values.quantity} error={e?.quantity} />
        <Select label="Unit" name="unit" options={UNITS} defaultValue={values.unit} error={e?.unit} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Ready for pickup"
          name="pickupAt"
          type="datetime-local"
          value={times.pickupAt}
          onChange={(ev) => setTimes((t) => ({ ...t, pickupAt: ev.target.value }))}
          error={e?.pickupAt}
        />
        <Input
          label="Best before"
          name="expiresAt"
          type="datetime-local"
          value={times.expiresAt}
          onChange={(ev) => setTimes((t) => ({ ...t, expiresAt: ev.target.value }))}
          error={e?.expiresAt}
        />
      </div>
      <Textarea label="Pickup address" name="pickupAddress" defaultValue={values.pickupAddress} error={e?.pickupAddress} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Contact name" name="contactName" defaultValue={values.contactName} error={e?.contactName} />
        <Input label="Contact phone" name="contactPhone" type="tel" defaultValue={values.contactPhone} error={e?.contactPhone} />
      </div>
      <Textarea label="Instructions" name="instructions" optional defaultValue={values.instructions ?? ""} error={e?.instructions} />
      <Button type="submit" loading={pending} className="rounded-full px-6">
        {t("Save changes")}
      </Button>
    </form>
  );
}
