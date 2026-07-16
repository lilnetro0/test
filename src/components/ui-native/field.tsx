import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type FieldBase = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  id?: string;
};

/**
 * Lightweight labeled control. Prefer placeholder + label over heavy containers.
 */
export function Field({
  label,
  hint,
  error,
  className,
  id,
  children,
}: FieldBase & { children: ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <label htmlFor={id} className="nx-label flex w-full items-center">
          {label}
        </label>
      ) : null}
      {children}
      {error ? <p className="nx-caption text-danger">{error}</p> : null}
      {!error && hint ? <p className="nx-caption">{hint}</p> : null}
    </div>
  );
}

const controlClass =
  "flex min-h-11 w-full rounded-lg border border-border-subtle bg-white/[0.03] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50";

export function FieldInput({
  label,
  hint,
  error,
  className,
  id,
  ...props
}: FieldBase & InputHTMLAttributes<HTMLInputElement>) {
  const inputId = id ?? props.name;
  return (
    <Field label={label} hint={hint} error={error} id={inputId} className={className}>
      <input id={inputId} className={cn(controlClass, "h-11")} {...props} />
    </Field>
  );
}

export function FieldTextarea({
  label,
  hint,
  error,
  className,
  id,
  ...props
}: FieldBase & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const inputId = id ?? props.name;
  return (
    <Field label={label} hint={hint} error={error} id={inputId} className={className}>
      <textarea id={inputId} className={cn(controlClass, "min-h-24 resize-y")} {...props} />
    </Field>
  );
}
