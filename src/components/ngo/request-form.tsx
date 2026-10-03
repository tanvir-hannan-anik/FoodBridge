"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Alert, Button, Input, Textarea } from "@/components/ui";
import { useFormAction } from "@/components/ui/use-form-action";
import type { FormState } from "@/lib/validation";

function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function RequestForm({
  action: serverAction,
  maxQuantity,
  unitLabel,
  defaultPeople,
  pickupAt,
  expiresAt,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  maxQuantity: number;
  unitLabel: string;
  defaultPeople: number;
  pickupAt: string;
  expiresAt: string;
}) {
  const { state, action, onSubmit, pending } = useFormAction(serverAction);
  const { t, number } = useI18n();
  const e = state?.errors;

  // Times depend on the device timezone, so they're filled in after mount.
  const [time, setTime] = useState({ preferredAt: "", tzOffset: "0", max: "" });
  useEffect(() => {
    const earliest = new Date(Math.max(Date.now(), new Date(pickupAt).getTime()));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only defaults
    setTime({
      preferredAt: toLocalInput(earliest),
      tzOffset: String(new Date().getTimezoneOffset()),
      max: toLocalInput(new Date(expiresAt)),
    });
  }, [pickupAt, expiresAt]);

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-5" noValidate>
      {state?.message && <Alert tone="error">{state.message}</Alert>}
      <input type="hidden" name="tzOffset" value={time.tzOffset} />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t("Quantity ({unit})", { unit: unitLabel })}
          name="quantity"
          type="number"
          inputMode="decimal"
          min="0.1"
          step="any"
          max={maxQuantity}
          defaultValue={maxQuantity}
          hint={t("Up to {n} available", { n: number(maxQuantity) })}
          error={e?.quantity}
        />
        <Input
          label="People to feed"
          name="people"
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          defaultValue={defaultPeople}
          error={e?.people}
        />
      </div>
      <Input
        label="Preferred pickup / delivery time"
        name="preferredAt"
        type="datetime-local"
        value={time.preferredAt}
        max={time.max || undefined}
        onChange={(ev) => setTime((t) => ({ ...t, preferredAt: ev.target.value }))}
        hint="Must be before the food’s best-before time."
        error={e?.preferredAt}
      />
      <Textarea
        label="Notes for the donor"
        name="notes"
        optional
        rows={2}
        maxLength={300}
        placeholder="e.g. We serve dinner to 60 children at 7 PM."
        error={e?.notes}
      />
      <Button type="submit" size="lg" block loading={pending} className="rounded-full">
        {t(pending ? "Sending request…" : "Request this food")}
      </Button>
    </form>
  );
}
