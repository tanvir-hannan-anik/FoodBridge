"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createDonation } from "@/app/actions/donations";
import { useI18n } from "@/components/i18n-provider";
import { LocationPicker } from "@/components/map/location-picker";
import { Alert, Button, Input, Select, Textarea } from "@/components/ui";
import { useFormAction } from "@/components/ui/use-form-action";
import { CATEGORY_LABEL, CONDITION_LABEL, UNIT_LABEL, toOptions } from "@/lib/donations/meta";
import type { DonationDraft } from "@/lib/ai/schemas";
import { safetyRulesText } from "@/lib/safety/meta";
import { MAX_IMAGE_BYTES } from "@/lib/validation";

const CATEGORIES = toOptions(CATEGORY_LABEL);
const UNITS = toOptions(UNIT_LABEL);
const CONDITIONS = toOptions(CONDITION_LABEL);

/** Formats a Date as the value a datetime-local input expects, in the device's timezone. */
function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type Defaults = {
  contactName: string;
  contactPhone: string;
  pickupAddress: string;
  point: { lat: number; lng: number } | null;
  /** Pre-filled by the AI assistant (or from an NGO request); the donor checks everything before posting. */
  draft?: DonationDraft | null;
  /** Posting for this NGO request: the food is offered to that NGO first. */
  needId?: string | null;
};

export function DonationForm({ defaults }: { defaults: Defaults }) {
  const { state, action, onSubmit, pending } = useFormAction(createDonation);
  const { t } = useI18n();
  const e = state?.errors;

  // Times depend on the device clock/timezone, so they're filled in after mount.
  const [times, setTimes] = useState({ preparedAt: "", pickupAt: "", expiresAt: "", tzOffset: "0", max: "" });
  const [imageError, setImageError] = useState<string>();

  const draft = defaults.draft;
  useEffect(() => {
    const now = new Date();
    const plus = (min: number) => toLocalInput(new Date(now.getTime() + min * 60_000));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only defaults
    setTimes({
      preparedAt: plus(-(draft?.preparedMinutesAgo ?? 0)),
      pickupAt: plus(draft?.pickupInMinutes ?? 30),
      expiresAt: plus(Math.round((draft?.bestBeforeInHours ?? 4) * 60)),
      tzOffset: String(now.getTimezoneOffset()),
      max: toLocalInput(now),
    });
  }, [draft]);

  const setTime = (key: "preparedAt" | "pickupAt" | "expiresAt") => (ev: React.ChangeEvent<HTMLInputElement>) =>
    setTimes((t) => ({ ...t, [key]: ev.target.value }));

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-5" noValidate>
      {state?.message && <Alert tone="error">{state.message}</Alert>}
      {draft && !defaults.needId && !state?.message && (
        <Alert tone="info" title="Filled in by the assistant">
          {t("Please check every field (especially quantity and times) before posting.")}
          {draft.missing.length > 0 && <> {t("Still needed: {list}.", { list: draft.missing.map((m) => t(m)).join(", ") })}</>}
        </Alert>
      )}
      <input type="hidden" name="tzOffset" value={times.tzOffset} />
      {defaults.needId && <input type="hidden" name="needId" value={defaults.needId} />}

      <Section step={1} title="What food are you donating?">
        <Input
          label="Food type"
          name="foodType"
          placeholder="e.g. Chicken biryani, bread loaves, mixed vegetables"
          defaultValue={draft?.foodType ?? ""}
          required
          error={e?.foodType}
        />
        <Select
          label="Category"
          name="category"
          options={CATEGORIES}
          placeholder="Choose a category"
          defaultValue={draft?.category ?? ""}
          required
          error={e?.category}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Quantity"
            name="quantity"
            type="number"
            inputMode="decimal"
            min="0.1"
            step="any"
            placeholder="e.g. 20"
            defaultValue={draft?.quantity ?? ""}
            required
            error={e?.quantity}
          />
          <Select label="Unit" name="unit" options={UNITS} defaultValue={draft?.unit ?? "plates"} required error={e?.unit} />
        </div>
        <Select
          label="Condition"
          name="condition"
          options={CONDITIONS}
          placeholder="How is the food?"
          defaultValue={draft?.condition ?? ""}
          required
          error={e?.condition}
        />
      </Section>

      <Section step={2} title="When? (food safety)">
        <details className="rounded-xl bg-cream-100 px-4 py-3 text-sm text-ink-700">
          <summary className="cursor-pointer font-semibold text-brand-950">{t("Food-safety rules")}</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {safetyRulesText().map((rule) => (
              <li key={rule}>{t(rule)}</li>
            ))}
          </ul>
        </details>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Prepared at"
            name="preparedAt"
            type="datetime-local"
            value={times.preparedAt}
            max={times.max || undefined}
            onChange={setTime("preparedAt")}
            required
            error={e?.preparedAt}
          />
          <Input
            label="Pickup from"
            name="pickupAt"
            type="datetime-local"
            value={times.pickupAt}
            onChange={setTime("pickupAt")}
            hint="Earliest time food is ready."
            required
            error={e?.pickupAt}
          />
          <Input
            label="Best before"
            name="expiresAt"
            type="datetime-local"
            value={times.expiresAt}
            onChange={setTime("expiresAt")}
            hint="Must be eaten by this time."
            required
            error={e?.expiresAt}
          />
        </div>
      </Section>

      <Section step={3} title="Where to pick up?">
        <Textarea
          label="Pickup address"
          name="pickupAddress"
          rows={2}
          defaultValue={draft?.pickupAddress || defaults.pickupAddress}
          placeholder="House, road, area, landmark"
          required
          error={e?.pickupAddress}
        />
        <LocationPicker
          label="Pickup spot on the map"
          hint="Helps us match the nearest NGO and guide the volunteer to you."
          names={{ lat: "pickupLat", lng: "pickupLng" }}
          defaultValue={defaults.point}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Contact person"
            name="contactName"
            autoComplete="name"
            defaultValue={defaults.contactName}
            required
            error={e?.contactName}
          />
          <Input
            label="Contact phone"
            name="contactPhone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            defaultValue={defaults.contactPhone}
            required
            error={e?.contactPhone}
          />
        </div>
      </Section>

      <Section step={4} title="Anything else?" optional>
        <Input
          label="Food photo"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          optional
          hint="JPG, PNG or WebP up to 2 MB. Helps NGOs decide faster."
          error={imageError ?? e?.image}
          className="[&_input]:py-2.5 [&_input]:file:mr-3 [&_input]:file:rounded-md [&_input]:file:border-0 [&_input]:file:rounded-full [&_input]:file:bg-cream-100 [&_input]:file:px-4 [&_input]:file:py-1.5 [&_input]:file:text-sm [&_input]:file:font-semibold [&_input]:file:text-brand-900"
          onChange={(ev) => {
            const file = ev.target.files?.[0];
            if (file && file.size > MAX_IMAGE_BYTES) {
              setImageError("Photo must be 2 MB or smaller.");
              ev.target.value = "";
            } else setImageError(undefined);
          }}
        />
        <Textarea
          label="Special instructions"
          name="instructions"
          optional
          placeholder="e.g. Ask for the manager at the back gate. Contains nuts."
          defaultValue={draft?.instructions ?? ""}
          maxLength={500}
          error={e?.instructions}
        />
      </Section>

      <div className="flex flex-col-reverse items-center gap-3 rounded-card border border-cream-200 bg-cream-100 p-5 sm:flex-row sm:justify-between">
        <p className="text-center text-xs text-ink-500 sm:text-left">
          {t("By posting, you confirm this food is safe to eat and stored hygienically.")}
        </p>
        <Button type="submit" size="lg" loading={pending} className="w-full rounded-full px-8 sm:w-auto">
          {pending ? t("Posting donation…") : t("Post donation")}
        </Button>
      </div>
    </form>
  );
}

function Section({ step, title, optional, children }: { step: number; title: string; optional?: boolean; children: ReactNode }) {
  const { t, number } = useI18n();
  return (
    <fieldset className="overflow-hidden rounded-card border border-cream-200 bg-white shadow-card">
      <legend className="sr-only">{t(title)}</legend>
      <div aria-hidden className="flex items-center gap-3 border-b border-cream-200 bg-cream-50 px-6 py-4">
        <span className="grid size-8 place-items-center rounded-full bg-brand-950 font-display text-sm font-semibold text-accent-300">
          {number(step)}
        </span>
        <span className="font-display text-lg font-semibold text-brand-950">
          {t(title)}
          {optional && <span className="ml-2 font-sans text-sm font-normal text-ink-500">{t("(optional)")}</span>}
        </span>
      </div>
      <div className="space-y-5 p-6">{children}</div>
    </fieldset>
  );
}
