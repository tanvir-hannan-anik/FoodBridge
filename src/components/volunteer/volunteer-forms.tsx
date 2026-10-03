"use client";

import { useState } from "react";
import { registerVolunteer } from "@/app/actions/auth";
import { acceptTask, updateVolunteerProfile } from "@/app/actions/volunteer";
import { useI18n } from "@/components/i18n-provider";
import { LocationPicker } from "@/components/map/location-picker";
import { Alert, Button, Input, Textarea } from "@/components/ui";
import { useFormAction } from "@/components/ui/use-form-action";
import { MAX_IMAGE_BYTES, type FormState } from "@/lib/validation";

export function VolunteerRegisterForm() {
  const { state, action, onSubmit, pending } = useFormAction(registerVolunteer);
  const { t } = useI18n();
  const e = state?.errors;
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4" noValidate>
      {state?.message && <Alert tone="error">{state.message}</Alert>}
      <Input label="Full name" name="name" autoComplete="name" error={e?.name} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Email" name="email" type="email" autoComplete="email" inputMode="email" error={e?.email} />
        <Input
          label="Phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="01712 345678"
          hint="Donors and NGOs call this number during a pickup."
          error={e?.phone}
        />
      </div>
      <Input label="Area you can cover" name="area" placeholder="e.g. Dhanmondi, Dhaka" error={e?.area} />
      <div className="grid gap-4 sm:grid-cols-2">
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
      <div>
        <label className="flex gap-3 text-sm text-ink-700">
          <input
            type="checkbox"
            name="terms"
            className="mt-0.5 size-4 shrink-0 rounded accent-brand-600"
            aria-invalid={e?.terms ? true : undefined}
          />
          {t("I will carry food hygienically, deliver it promptly and never sell or keep it.")}
        </label>
        {e?.terms && <p className="mt-1 text-xs font-medium text-red-600">{t(e.terms[0])}</p>}
      </div>
      <Button type="submit" block size="lg" loading={pending}>
        {t("Create volunteer account")}
      </Button>
    </form>
  );
}

type Profile = {
  name: string;
  phone: string;
  area: string | null;
  address: string | null;
  description: string | null;
  point: { lat: number; lng: number } | null;
};

export function VolunteerProfileForm({ profile }: { profile: Profile }) {
  const { state, action, onSubmit, pending } = useFormAction(updateVolunteerProfile);
  const { t } = useI18n();
  const e = state?.errors;
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4" noValidate>
      {state?.success && <Alert tone="success">{state.success}</Alert>}
      <Input label="Full name" name="name" autoComplete="name" defaultValue={profile.name} error={e?.name} />
      <Input label="Phone" name="phone" type="tel" autoComplete="tel" defaultValue={profile.phone} error={e?.phone} />
      <Input
        label="Area you can cover"
        name="area"
        placeholder="e.g. Dhanmondi, Dhaka"
        defaultValue={profile.area ?? ""}
        error={e?.area}
      />
      <Input
        label="Home base / address"
        name="address"
        autoComplete="street-address"
        defaultValue={profile.address ?? ""}
        optional
        error={e?.address}
      />
      <Textarea
        label="About you"
        name="description"
        placeholder="e.g. I have a motorbike and I’m free most evenings."
        defaultValue={profile.description ?? ""}
        optional
        error={e?.description}
      />
      <LocationPicker
        label="Home base on the map"
        hint="Pickups near here are offered to you first. You can also update it from your dashboard when you’re out."
        defaultValue={profile.point}
      />
      <Button type="submit" loading={pending} className="rounded-full px-6">
        {t("Save changes")}
      </Button>
    </form>
  );
}

export function AcceptTaskForm({ donationId }: { donationId: string }) {
  const { state, action, onSubmit, pending } = useFormAction(acceptTask.bind(null, donationId));
  const { t } = useI18n();
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-3">
      {state?.message && <Alert tone="error">{state.message}</Alert>}
      <Button type="submit" block size="lg" loading={pending} className="h-14 rounded-full text-lg">
        {t("Accept task")}
      </Button>
    </form>
  );
}

/** Confirms pickup or delivery. The server records the time; note and photo are optional. */
export function ProofForm({
  action: serverAction,
  label,
  notePlaceholder,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  label: string;
  notePlaceholder: string;
}) {
  const { state, action, onSubmit, pending } = useFormAction(serverAction);
  const [photoError, setPhotoError] = useState<string>();
  const { t } = useI18n();
  const e = state?.errors;

  if (state?.success) return <Alert tone="success">{state.success}</Alert>;

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4" noValidate>
      {state?.message && <Alert tone="error">{state.message}</Alert>}
      <Textarea label="Note" name="note" rows={2} placeholder={notePlaceholder} optional error={e?.note} />
      <Input
        label="Photo"
        name="photo"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        optional
        hint="JPG, PNG or WebP, up to 2 MB."
        error={photoError ?? e?.photo}
        className="[&_input]:h-auto [&_input]:py-2.5"
        onChange={(ev) => {
          const file = ev.target.files?.[0];
          if (file && file.size > MAX_IMAGE_BYTES) {
            setPhotoError("Photo must be 2 MB or smaller.");
            ev.target.value = "";
          } else setPhotoError(undefined);
        }}
      />
      <Button type="submit" block size="lg" loading={pending} className="h-14 rounded-full text-lg">
        {t(label)}
      </Button>
    </form>
  );
}
