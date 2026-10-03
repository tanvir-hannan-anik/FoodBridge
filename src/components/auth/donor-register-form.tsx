"use client";

import { useState } from "react";
import { useFormAction } from "@/components/ui/use-form-action";
import { registerDonor } from "@/app/actions/auth";
import { useI18n } from "@/components/i18n-provider";
import { Alert, Button, Input, Select } from "@/components/ui";
import { DONOR_TYPE_LABEL, toOptions } from "@/lib/donations/meta";

const DONOR_TYPES = toOptions(DONOR_TYPE_LABEL);

/** `next`: where to go after signing up (e.g. the donation form the assistant filled in). */
export function DonorRegisterForm({ next }: { next?: string }) {
  const { state, action, onSubmit, pending } = useFormAction(registerDonor);
  const [donorType, setDonorType] = useState("");
  const { t } = useI18n();
  const e = state?.errors;

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {state?.message && <Alert tone="error">{state.message}</Alert>}

      <Select
        label="I am a…"
        name="donorType"
        options={DONOR_TYPES}
        placeholder="Choose one"
        value={donorType}
        onChange={(ev) => setDonorType(ev.target.value)}
        required
        error={e?.donorType}
      />
      {donorType !== "individual" && (
        <Input
          label="Business / organisation name"
          name="organizationName"
          autoComplete="organization"
          placeholder="e.g. Star Kabab, Dhanmondi"
          error={e?.organizationName}
        />
      )}
      <Input label="Your full name" name="name" autoComplete="name" required error={e?.name} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          error={e?.email}
        />
        <Input
          label="Phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="01712 345678"
          required
          error={e?.phone}
        />
      </div>
      <Input
        label="Pickup address"
        name="address"
        autoComplete="street-address"
        hint="Used as the default pickup address. You can change it per donation."
        required
        error={e?.address}
      />
      <Input label="Area / city" name="area" placeholder="e.g. Mirpur, Dhaka" optional error={e?.area} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="8+ characters with a letter and a number."
          required
          error={e?.password}
        />
        <Input
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          error={e?.confirmPassword}
        />
      </div>

      <div>
        <label className="flex gap-3 text-sm text-ink-700">
          <input
            type="checkbox"
            name="terms"
            className="mt-0.5 size-4 shrink-0 rounded accent-brand-600"
            aria-invalid={e?.terms ? true : undefined}
          />
          {t("I will only donate food that is safe to eat, stored hygienically and within its best-before time.")}
        </label>
        {e?.terms && <p className="mt-1 text-xs font-medium text-red-600">{t(e.terms[0])}</p>}
      </div>

      <Button type="submit" block size="lg" loading={pending}>
        {t("Create donor account")}
      </Button>
    </form>
  );
}
