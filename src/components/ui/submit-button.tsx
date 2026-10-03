"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "./button";

/** Submit button that shows a spinner while its parent <form> action is pending. */
export function SubmitButton({ pendingLabel, children, ...props }: ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  const label = pending && pendingLabel ? pendingLabel : children;
  return (
    <Button type="submit" loading={pending} {...props}>
      {typeof label === "string" ? t(label) : label}
    </Button>
  );
}
