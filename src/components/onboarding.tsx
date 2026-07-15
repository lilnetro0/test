import { useEffect, useMemo, useState } from "react";
import { Sparkles, Gamepad2, MessageSquare, Mic, LayoutGrid, Keyboard, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { isPhoneLikeUi } from "@/lib/capacitor";

const KEY = "nexus.onboarding.seen.v1";

/**
 * First-visit onboarding sheet. Renders once per browser (localStorage flag).
 * Non-blocking: dismiss to skip. Reappears only if localStorage is cleared.
 * Desktop ⌘K step is omitted on phone / Capacitor.
 */
export function Onboarding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState(false);
  const { t } = useT();

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPhone(isPhoneLikeUi());
    const seen = window.localStorage.getItem(KEY);
    if (!seen) setOpen(true);
  }, []);

  const close = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      // Storage may be blocked; onboarding will simply reappear next visit.
    }
  };

  const steps = useMemo(() => {
    const all = [
      { icon: Sparkles, title: t("onboarding.step1.title"), body: t("onboarding.step1.body") },
      { icon: Gamepad2, title: t("onboarding.step2.title"), body: t("onboarding.step2.body") },
      { icon: MessageSquare, title: t("onboarding.step3.title"), body: t("onboarding.step3.body") },
      { icon: Mic, title: t("onboarding.step4.title"), body: t("onboarding.step4.body") },
      { icon: LayoutGrid, title: t("onboarding.step5.title"), body: t("onboarding.step5.body") },
      {
        icon: Keyboard,
        title: t("onboarding.step6.title"),
        body: t("onboarding.step6.body"),
        desktopOnly: true as const,
      },
    ];
    return phone ? all.filter((s) => !s.desktopOnly) : all;
  }, [t, phone]);

  if (!open) return null;

  const s = steps[step] ?? steps[0];
  if (!s) return null;
  const Icon = s.icon;
  const isLast = step >= steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 pt-safe pb-safe">
      <button
        aria-label={t("onboarding.skip")}
        onClick={close}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border-subtle bg-surface-mid shadow-2xl motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:duration-200">
        <button
          onClick={close}
          aria-label={t("onboarding.close")}
          className="absolute top-3 grid size-8 place-items-center rounded-lg text-stone-500 hover:bg-white/5 hover:text-white ltr:right-3 rtl:left-3"
        >
          <X className="size-4" />
        </button>

        <div className="border-b border-border-subtle bg-gradient-to-br from-accent/15 via-transparent to-transparent p-8">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-accent/40 bg-accent/10 text-accent shadow-[var(--shadow-glow-accent)]">
            <Icon className="size-6" />
          </div>
          <h2 className="mt-4 text-center font-display text-lg font-bold uppercase tracking-tight text-white">
            {s.title}
          </h2>
          <p className="mx-auto mt-2 max-w-xs text-center text-sm text-stone-400">{s.body}</p>
        </div>

        <div className="flex items-center justify-between p-4">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-accent" : "w-1.5 bg-stone-700"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={close}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400 hover:text-white"
            >
              {t("onboarding.skip")}
            </button>
            <button
              onClick={() => (isLast ? close() : setStep((n) => n + 1))}
              className="rounded-lg bg-accent px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-accent-foreground hover:brightness-110"
            >
              {isLast ? t("onboarding.enter") : t("onboarding.next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
