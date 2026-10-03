"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { LocationPicker } from "@/components/map/location-picker";
import { Alert, Button, Input, Select, Textarea } from "@/components/ui";
import { useFormAction } from "@/components/ui/use-form-action";
import type { FoodCategory, Unit } from "@/db/schema";
import { CATEGORY_LABEL, UNIT_LABEL, toOptions } from "@/lib/donations/meta";
import type { FormState } from "@/lib/validation";

const CATEGORIES = [{ value: "", label: "Any food" }, ...toOptions(CATEGORY_LABEL)];
const UNITS = toOptions(UNIT_LABEL);

function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export type NeedDefaults = {
  category: FoodCategory | null;
  foodType: string | null;
  quantity: number | null;
  unit: Unit;
  people: number | null;
  area: string;
  address: string | null;
  /** Delivery pin: the request's own, else the NGO's profile pin. */
  point: { lat: number; lng: number } | null;
  /** ISO string; empty = 3 hours from now */
  neededBy: string;
  /** Set when the AI assistant pre-filled the form; shown as a reminder to check it. */
  missing?: string[];
  notes: string | null;
};

/** Create or edit an NGO food request. Only what's needed to match food: no recipient personal data. */
export function NeedForm({
  action: serverAction,
  defaults,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaults: NeedDefaults;
  submitLabel: string;
}) {
  const { state, action, onSubmit, pending } = useFormAction(serverAction);
  const { t } = useI18n();
  const e = state?.errors;

  // The time field depends on the device timezone, so it's filled in after mount.
  const [time, setTime] = useState({ neededBy: "", tzOffset: "0", min: "" });
  useEffect(() => {
    const when = defaults.neededBy ? new Date(defaults.neededBy) : new Date(Date.now() + 3 * 3_600_000);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only defaults
    setTime({
      neededBy: toLocalInput(when),
      tzOffset: String(new Date().getTimezoneOffset()),
      min: toLocalInput(new Date(Date.now() + 30 * 60_000)),
    });
  }, [defaults.neededBy]);

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-5" noValidate>
      {state?.message && <Alert tone="error">{state.message}</Alert>}
      {defaults.missing && !state?.message && (
        <Alert tone="info" title="Filled in by the assistant">
          {t("Please check every field before posting.")}
          {defaults.missing.length > 0 && <> {t("Still needed: {list}.", { list: defaults.missing.map((m) => t(m)).join(", ") })}</>}
        </Alert>
      )}
      <input type="hidden" name="tzOffset" value={time.tzOffset} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Food type"
          name="category"
          options={CATEGORIES}
          defaultValue={defaults.category ?? ""}
          hint="Choose “Any food” to be matched with anything suitable."
          error={e?.category}
        />
        <Input
          label="Description"
          name="foodType"
          optional
          placeholder="e.g. Rice and curry for dinner"
          defaultValue={defaults.foodType ?? ""}
          error={e?.foodType}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Input
          label="Quantity needed"
          name="quantity"
          type="number"
          inputMode="decimal"
          min="0.1"
          step="any"
          defaultValue={defaults.quantity ?? ""}
          error={e?.quantity}
        />
        <Select label="Unit" name="unit" options={UNITS} defaultValue={defaults.unit} error={e?.unit} />
        <Input
          label="People to serve"
          name="people"
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          defaultValue={defaults.people ?? ""}
          hint="Estimated meals needed."
          error={e?.people}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Service area" name="area" defaultValue={defaults.area} placeholder="e.g. Mirpur, Dhaka" error={e?.area} />
        <Input
          label="Delivery address"
          name="address"
          optional
          autoComplete="street-address"
          defaultValue={defaults.address ?? ""}
          error={e?.address}
        />
      </div>

      <LocationPicker
        label="Delivery location on the map"
        hint="Used to match the nearest food and guide the volunteer. Defaults to your organisation’s pin."
        defaultValue={defaults.point}
      />

      <Input
        label="Needed by"
        name="neededBy"
        type="datetime-local"
        value={time.neededBy}
        min={time.min || undefined}
        onChange={(ev) => setTime((t) => ({ ...t, neededBy: ev.target.value }))}
        hint="We match food that can be picked up before this time."
        error={e?.neededBy}
      />
      <Textarea
        label="Notes"
        name="notes"
        optional
        rows={2}
        maxLength={300}
        placeholder="e.g. Children’s dinner at 7 PM, no beef please."
        defaultValue={defaults.notes ?? ""}
        hint="Don’t include names or personal details of the people you serve."
        error={e?.notes}
      />

      <Button type="submit" size="lg" block loading={pending} className="rounded-full">
        {t(submitLabel)}
      </Button>
    </form>
  );
}
