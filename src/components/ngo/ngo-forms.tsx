"use client";

import { registerNgo } from "@/app/actions/auth";
import { updateNgoProfile } from "@/app/actions/ngo";
import { useI18n } from "@/components/i18n-provider";
import { LocationPicker } from "@/components/map/location-picker";
import { Alert, Button, Input, Select, Textarea } from "@/components/ui";
import { useFormAction } from "@/components/ui/use-form-action";
import { toOptions } from "@/lib/donations/meta";
import { NGO_TYPE_LABEL } from "@/lib/ngo/meta";

const NGO_TYPES = toOptions(NGO_TYPE_LABEL);

export function NgoRegisterForm() {
  const { state, action, onSubmit, pending } = useFormAction(registerNgo);
  const { t } = useI18n();
  const e = state?.errors;
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-5" noValidate>
      {state?.message && <Alert tone="error">{state.message}</Alert>}

      <FormSection title="Organisation">
        <Input label="Organisation name" name="organizationName" autoComplete="organization" error={e?.organizationName} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Select label="Type" name="ngoType" options={NGO_TYPES} placeholder="Choose one" error={e?.ngoType} />
          <Input
            label="Registration no."
            name="registrationNo"
            optional
            hint="NGO Affairs Bureau / Social Welfare no."
            error={e?.registrationNo}
          />
        </div>
        <Input
          label="Address"
          name="address"
          autoComplete="street-address"
          hint="Where food is usually delivered."
          error={e?.address}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Service area" name="area" placeholder="e.g. Mirpur, Dhaka" error={e?.area} />
          <Input
            label="People served per day"
            name="capacity"
            type="number"
            inputMode="numeric"
            min="1"
            optional
            error={e?.capacity}
          />
        </div>
      </FormSection>

      <FormSection title="Contact person">
        <Input label="Full name" name="name" autoComplete="name" error={e?.name} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Email" name="email" type="email" autoComplete="email" inputMode="email" error={e?.email} />
          <Input label="Phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="01712 345678" error={e?.phone} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            hint="8+ characters with a letter and a number."
            error={e?.password}
          />
          <Input
            label="Confirm password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            error={e?.confirmPassword}
          />
        </div>
      </FormSection>

      <div>
        <label className="flex gap-3 text-sm text-ink-700">
          <input type="checkbox" name="terms" className="mt-0.5 size-4 shrink-0 rounded accent-brand-600" />
          {t("We will handle donated food hygienically, serve it promptly and never sell it.")}
        </label>
        {e?.terms && <p className="mt-1 text-xs font-medium text-red-600">{t(e.terms[0])}</p>}
      </div>

      <Button type="submit" block size="lg" loading={pending} className="rounded-full">
        {t("Create NGO account")}
      </Button>
    </form>
  );
}

type NgoProfile = {
  organizationName: string | null;
  ngoType: string | null;
  registrationNo: string | null;
  name: string;
  phone: string;
  address: string | null;
  area: string | null;
  capacity: number | null;
  description: string | null;
  point: { lat: number; lng: number } | null;
};

export function NgoProfileForm({ profile }: { profile: NgoProfile }) {
  const { state, action, onSubmit, pending } = useFormAction(updateNgoProfile);
  const { t } = useI18n();
  const e = state?.errors;
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-5" noValidate>
      {state?.success && <Alert tone="success">{state.success}</Alert>}
      <Input
        label="Organisation name"
        name="organizationName"
        defaultValue={profile.organizationName ?? ""}
        error={e?.organizationName}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          label="Type"
          name="ngoType"
          options={NGO_TYPES}
          placeholder="Choose one"
          defaultValue={profile.ngoType ?? ""}
          error={e?.ngoType}
        />
        <Input
          label="Registration no."
          name="registrationNo"
          optional
          defaultValue={profile.registrationNo ?? ""}
          error={e?.registrationNo}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Contact person" name="name" autoComplete="name" defaultValue={profile.name} error={e?.name} />
        <Input label="Phone" name="phone" type="tel" autoComplete="tel" defaultValue={profile.phone} error={e?.phone} />
      </div>
      <Input
        label="Address"
        name="address"
        autoComplete="street-address"
        defaultValue={profile.address ?? ""}
        error={e?.address}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Service area"
          name="area"
          defaultValue={profile.area ?? ""}
          hint="Used to show nearby food first."
          error={e?.area}
        />
        <Input
          label="People served per day"
          name="capacity"
          type="number"
          inputMode="numeric"
          min="1"
          optional
          defaultValue={profile.capacity ?? ""}
          error={e?.capacity}
        />
      </div>
      <Textarea
        label="About your organisation"
        name="description"
        optional
        rows={3}
        maxLength={500}
        defaultValue={profile.description ?? ""}
        placeholder="Who you serve, meal times, storage (fridge, freezer)…"
        error={e?.description}
      />
      <LocationPicker
        label="Delivery point on the map"
        hint="Where volunteers bring food. Used to match the nearest donations first."
        defaultValue={profile.point}
      />
      <Button type="submit" loading={pending} className="rounded-full px-6">
        {t("Save changes")}
      </Button>
    </form>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <fieldset className="space-y-5">
      <legend className="mb-4 font-display text-lg font-semibold text-brand-950">{t(title)}</legend>
      {children}
    </fieldset>
  );
}
