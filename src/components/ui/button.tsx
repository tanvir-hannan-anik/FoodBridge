import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./loading";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-600 text-white shadow-glow hover:bg-brand-700 active:bg-brand-800",
  secondary: "bg-cream-100 text-brand-900 hover:bg-cream-200",
  outline: "border border-brand-900/15 bg-white text-brand-950 hover:bg-cream-100",
  ghost: "text-brand-900 hover:bg-cream-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export type ButtonVariant = Variant;

export function buttonStyles({
  variant = "primary",
  size = "md",
  block,
  className,
}: { variant?: Variant; size?: Size; block?: boolean; className?: string } = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-field font-semibold transition-colors",
    "disabled:pointer-events-none disabled:opacity-60",
    VARIANTS[variant],
    SIZES[size],
    block && "w-full",
    className,
  );
}

type StyleProps = { variant?: Variant; size?: Size; block?: boolean };

export function Button({
  variant,
  size,
  block,
  loading,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ComponentProps<"button"> & StyleProps & { loading?: boolean }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles({ variant, size, block, className })}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}

export function ButtonLink({ variant, size, block, className, ...props }: ComponentProps<typeof Link> & StyleProps) {
  return <Link className={buttonStyles({ variant, size, block, className })} {...props} />;
}
