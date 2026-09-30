import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

const CONTROL =
  "block w-full rounded-field border bg-white px-4 text-base text-ink-900 placeholder:text-ink-500 " +
  "transition-colors focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/25 " +
  "disabled:bg-ink-100 disabled:text-ink-500 sm:text-sm";

function controlClass(error: unknown, className?: string) {
  return cn(CONTROL, error ? "border-red-500 bg-red-50/40" : "border-cream-300", className);
}

type FieldProps = {
  label: string;
  name: string;
  hint?: ReactNode;
  error?: string | string[];
  optional?: boolean;
  className?: string;
};

type A11y = { id: string; "aria-invalid"?: true; "aria-describedby"?: string };

/** Label + control + hint/error, wired up with ids and aria attributes. */
function Field({
  label,
  name,
  hint,
  error,
  optional,
  className,
  children,
}: FieldProps & { children: (a11y: A11y) => ReactNode }) {
  const id = `field-${name}`;
  const message = Array.isArray(error) ? error[0] : error;
  const describedBy = [hint && `${id}-hint`, message && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-semibold text-brand-950">
        {label}
        {optional && <span className="ml-1 font-normal text-ink-500">(optional)</span>}
      </label>
      {children({ id, "aria-invalid": message ? true : undefined, "aria-describedby": describedBy })}
      {hint && !message && (
        <p id={`${id}-hint`} className="text-xs text-ink-500">
          {hint}
        </p>
      )}
      {message && (
        <p id={`${id}-error`} className="text-xs font-medium text-red-600">
          {message}
        </p>
      )}
    </div>
  );
}

export function Input({
  label,
  hint,
  error,
  optional,
  className,
  name,
  ...props
}: FieldProps & Omit<ComponentProps<"input">, "name">) {
  return (
    <Field label={label} name={name} hint={hint} error={error} optional={optional} className={className}>
      {(a11y) => <input name={name} {...a11y} {...props} className={controlClass(error, "h-12")} />}
    </Field>
  );
}

export function Textarea({
  label,
  hint,
  error,
  optional,
  className,
  name,
  ...props
}: FieldProps & Omit<ComponentProps<"textarea">, "name">) {
  return (
    <Field label={label} name={name} hint={hint} error={error} optional={optional} className={className}>
      {(a11y) => <textarea name={name} rows={3} {...a11y} {...props} className={controlClass(error, "py-2.5")} />}
    </Field>
  );
}

export type Option = { value: string; label: string };

export function Select({
  label,
  hint,
  error,
  optional,
  className,
  name,
  options,
  placeholder,
  ...props
}: FieldProps & Omit<ComponentProps<"select">, "name"> & { options: readonly Option[]; placeholder?: string }) {
  return (
    <Field label={label} name={name} hint={hint} error={error} optional={optional} className={className}>
      {(a11y) => (
        <div className="relative">
          <select name={name} {...a11y} {...props} className={controlClass(error, "h-12 appearance-none pr-10")}>
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-500"
            fill="currentColor"
          >
            <path d="M5.2 7.2a.75.75 0 0 1 1.06 0L10 10.94l3.74-3.74a.75.75 0 1 1 1.06 1.06l-4.27 4.27a.75.75 0 0 1-1.06 0L5.2 8.26a.75.75 0 0 1 0-1.06Z" />
          </svg>
        </div>
      )}
    </Field>
  );
}
