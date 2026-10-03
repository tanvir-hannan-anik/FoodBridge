"use client";

import { useFormAction } from "@/components/ui/use-form-action";
import { login } from "@/app/actions/auth";
import { useI18n } from "@/components/i18n-provider";
import { Alert, Button, Input } from "@/components/ui";

export function LoginForm({ next }: { next?: string }) {
  const { state, action, onSubmit, pending } = useFormAction(login);
  const { t } = useI18n();
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4" noValidate>
      {state?.message && <Alert tone="error">{state.message}</Alert>}
      {next && <input type="hidden" name="next" value={next} />}
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        error={state?.errors?.email}
      />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={state?.errors?.password}
      />
      <Button type="submit" block size="lg" loading={pending}>
        {t("Log in")}
      </Button>
    </form>
  );
}
