import { GAMES } from "@/lib/mock-data";
import logo from "@/assets/nexus-logo.png";
import { Link } from "@tanstack/react-router";
import { LegalLinks } from "@/components/legal-page";

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
  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-y-auto bg-background p-6 pt-safe pb-safe">
      {/* Ambient game-tile backdrop */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -left-10 top-10 grid grid-cols-2 gap-4 blur-[1px]">
          {GAMES.slice(0, 4).map((g) => (
            <div key={g.id} className={`grid size-20 place-items-center rounded-2xl ${g.tint}`}>
              <span className={`font-display text-xs font-bold ${g.textTint}`}>{g.short}</span>
            </div>
          ))}
        </div>
        <div className="absolute -right-6 bottom-10 grid grid-cols-2 gap-4 blur-[1px]">
          {GAMES.slice(4, 8).map((g) => (
            <div key={g.id} className={`grid size-20 place-items-center rounded-2xl ${g.tint}`}>
              <span className={`font-display text-xs font-bold ${g.textTint}`}>{g.short}</span>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/90 to-background" />
      </div>

      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <img src={logo} alt="Nexus" width={40} height={40} className="size-10 object-contain" />
          <span className="font-display text-xl font-bold uppercase tracking-tight text-white">
            Nexus
          </span>
        </Link>

        <div className="rounded-2xl border border-border-subtle bg-surface-mid/80 p-8 backdrop-blur-xl">
          <div className="mb-6 text-center">
            <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
              {title}
            </h1>
            {subtitle && <p className="mt-2 text-sm text-stone-400">{subtitle}</p>}
          </div>
          {children}
        </div>

        {footer && (
          <div className="mt-6 text-center text-sm text-stone-400">{footer}</div>
        )}
        <div className="mt-4 flex justify-center">
          <LegalLinks />
        </div>
      </div>
    </div>
  );
}

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
}: {
  label: string;
  type?: string;
  placeholder?: string;
  hint?: React.ReactNode;
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
          {label}
        </span>
        {hint && <span className="text-[11px] text-accent hover:underline">{hint}</span>}
      </div>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        required={required}
        autoComplete={autoComplete}
        minLength={minLength}
        className="w-full rounded-lg border border-border-subtle bg-background px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-stone-600 focus:border-accent/50"
      />
    </label>
  );
}
