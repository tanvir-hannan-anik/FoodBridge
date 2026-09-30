"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import type { FormState } from "@/lib/validation";

/**
 * useActionState, but submitting through onSubmit so React doesn't reset the form
 * afterwards — people keep what they typed when validation fails.
 * Pass both `action` and `onSubmit` to the <form>; `action` keeps it working without JS.
 */
export function useFormAction(fn: (state: FormState, formData: FormData) => Promise<FormState>) {
  const [state, action, pending] = useActionState(fn, undefined);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  };
  return { state, action, onSubmit, pending };
}
