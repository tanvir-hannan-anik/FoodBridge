"use client";

import { changePassword, updateProfile } from "@/app/actions/profile";
import { useI18n } from "@/components/i18n-provider";
import { LocationPicker } from "@/components/map/location-picker";
import { Alert, Button, Input } from "@/components/ui";
import { useFormAction } from "@/components/ui/use-form-action";

type Profile = {
  name: string;
  phone: string;
  organizationName: string | null;
  address: string | null;
  area: string | null;
  point: { lat: number; lng: number } | null;
  showOrganization: boolean;
};

export function ProfileForm({ profile }: { profile: Profile }) {
  const { state, action, onSubmit, pending } = useFormAction(updateProfile);
  const { t } = useI18n();
  const e = state?.errors;
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4" noValidate>
      {state?.success && <Alert tone="success">{state.success}</Alert>}
      <Input label="Full name" name="name" autoComplete="name" defaultValue={profile.name} error={e?.name} />
      <Input
        label="Phone"
        name="phone"
        type="tel"
        autoComplete="tel"
        defaultValue={profile.phone}
        error={e?.phone}
      />
      {profile.showOrganization && (
        <Input
          label="Business / organisation name"
          name="organizationName"
          defaultValue={profile.organizationName ?? ""}
          error={e?.organizationName}
        />
      )}
      <Input
        label="Default pickup address"
        name="address"
        autoComplete="street-address"
        defaultValue={profile.address ?? ""}
        optional
        error={e?.address}
      />
      <Input label="Area / city" name="area" defaultValue={profile.area ?? ""} optional error={e?.area} />
      <LocationPicker
        label="Usual pickup spot"
        hint="Pre-fills the map pin on new donations, so NGOs and volunteers nearby find you."
        defaultValue={profile.point}
      />
      <Button type="submit" loading={pending} className="rounded-full px-6">
        {t("Save changes")}
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const { state, action, onSubmit, pending } = useFormAction(changePassword);
  const { t } = useI18n();
  const e = state?.errors;
  return (
    <form
      action={action}
      onSubmit={(ev) => {
        onSubmit(ev);
        ev.currentTarget.reset();
      }}
      className="space-y-4"
      noValidate
    >
      {state?.success && <Alert tone="success">{state.success}</Alert>}
      <Input
        label="Current password"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        error={e?.currentPassword}
      />
      <Input
        label="New password"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        hint="8+ characters with a letter and a number."
        error={e?.newPassword}
      />
      <Input
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        error={e?.confirmPassword}
      />
      <Button type="submit" variant="outline" loading={pending} className="rounded-full px-6">
        {t("Update password")}
      </Button>
    </form>
  );
}
