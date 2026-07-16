import logo from "@/assets/nexus-logo.png";
import type { ReactNode } from "react";
import { AppNav } from "@/components/app-nav";
import { LegalLinks } from "@/components/legal-page";
import { Field } from "@/components/ui-native";
import { useT, type Lang, LANG_LABELS } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Full-bleed native auth frame — quiet background, no glass card / game-tile collage.
 * Brand is the primary signal; form title is secondary (design.md).
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { lang, setLang, t } = useT();

  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-y-auto bg-background pt-safe pb-safe">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--accent)_8%,transparent),transparent_52%)]"
        aria-hidden
      />

      <div className="relative z-10 flex justify-end px-4 py-3">
        <div
          className="inline-flex rounded-full border border-border-subtle/80 bg-surface-mid/60 p-0.5 text-[11px] font-medium shadow-[var(--nx-shadow-1)]"
          role="group"
          aria-label={t("settings.section.language")}
        >
          {(["ar", "en"] as Lang[]).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              className={cn(
                "rounded-full px-3 py-1.5 transition-colors",
                lang === code ? "bg-accent/18 text-accent" : "text-stone-400 hover:text-white",
              )}
            >
              {LANG_LABELS[code].native}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-8">
        <AppNav
          to="/"
          search={{}}
          className="mb-6 flex w-full flex-col items-center gap-2 text-center"
          aria-label="Nexus"
        >
          <img
            src={logo}
            alt=""
            width={44}
            height={44}
            draggable={false}
            className="nx-no-drag size-11 object-contain"
          />
          <span className="font-display text-[1.75rem] font-bold tracking-tight text-white">
            Nexus
          </span>
        </AppNav>

        <div className="mb-6 text-center">
          <h1 className="nx-title text-lg">{title}</h1>
          {subtitle ? <p className="nx-body mt-1.5">{subtitle}</p> : null}
        </div>

        {children}

        {footer ? <div className="nx-body mt-8 text-center">{footer}</div> : null}
        <div className="mt-6 flex justify-center">
          <LegalLinks />
        </div>
      </div>
    </div>
  );
}

const controlClass =
  "flex min-h-11 w-full rounded-lg border border-border-subtle bg-white/[0.03] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50";

/** Auth-specific field: label + optional end hint (e.g. Forgot) using Phase B Field chrome. */
export function AuthField({
  label,
  type = "text",
  placeholder,
  hint,
  name,
  value,
  onChange,
  required,
  autoComplete,
  minLength,
  id,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  hint?: ReactNode;
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
  id?: string;
}) {
  const inputId = id ?? name;
  return (
    <Field
      label={
        <span className="flex w-full items-center justify-between gap-2">
          <span>{label}</span>
          {hint ? <span className="font-normal text-accent">{hint}</span> : null}
        </span>
      }
      id={inputId}
    >
      <input
        id={inputId}
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        required={required}
        autoComplete={autoComplete}
        minLength={minLength}
        className={cn(controlClass, "h-11")}
      />
    </Field>
  );
}
