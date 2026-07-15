import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { useT } from "@/lib/i18n";

const KEY = "nexus.whatsnew.seen.v3";

const CHANGES_EN = [
  { title: "Bottom dock navigation", body: "One persistent dock on every screen — hubs open from the Nexus button." },
  { title: "Arabic + RTL", body: "Full interface language switch with right-to-left layout." },
  { title: "Message search & / focus", body: "Search inside the current hub, or press / to jump straight into the composer." },
  { title: "Your profile (/me)", body: "Edit your bio and status in place — persisted locally for this demo." },
];

const CHANGES_AR = [
  { title: "التنقل من الشريط السفلي", body: "شريط واحد دائم على كل الشاشات — المراكز تُفتح من زر Nexus." },
  { title: "العربية واتجاه RTL", body: "تبديل لغة الواجهة بالكامل مع تخطيط من اليمين إلى اليسار." },
  { title: "بحث الرسائل وتركيز /", body: "ابحث داخل المركز الحالي، أو اضغط / للانتقال مباشرة إلى حقل الكتابة." },
  { title: "ملفك الشخصي (/me)", body: "عدّل نبذتك وحالتك مباشرة — تُحفظ محليًا في هذا العرض التجريبي." },
];

/**
 * Lightweight "What's new" changelog. Shows once per version key,
 * or when `nexus:open-whats-new` is dispatched (e.g. from Settings).
 */
export function WhatsNew() {
  const [open, setOpen] = useState(false);
  const { t, lang } = useT();
  const changes = lang === "ar" ? CHANGES_AR : CHANGES_EN;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const maybeAutoOpen = () => {
      try {
        // Don't stack on first-visit onboarding.
        if (!window.localStorage.getItem("nexus.onboarding.seen.v1")) return;
        if (!window.localStorage.getItem(KEY)) setOpen(true);
      } catch {
        /* ignore */
      }
    };

    maybeAutoOpen();
    // Re-check shortly after mount in case onboarding closes in this session.
    const timer = window.setTimeout(maybeAutoOpen, 400);

    const openHandler = () => setOpen(true);
    window.addEventListener("nexus:open-whats-new", openHandler);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("nexus:open-whats-new", openHandler);
    };
  }, []);

  const close = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        aria-label={t("whatsnew.close")}
        onClick={close}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />
      <div
        role="dialog"
        aria-labelledby="whats-new-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border-subtle bg-surface-mid shadow-2xl motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:duration-200"
      >
        <button
          onClick={close}
          aria-label={t("whatsnew.close")}
          className="absolute end-3 top-3 grid size-8 place-items-center rounded-lg text-stone-500 hover:bg-white/5 hover:text-white"
        >
          <X className="size-4" />
        </button>

        <div className="border-b border-border-subtle bg-gradient-to-br from-accent/15 via-transparent to-transparent p-6">
          <div className="grid size-12 place-items-center rounded-2xl border border-accent/40 bg-accent/10 text-accent shadow-[var(--shadow-glow-accent)]">
            <Sparkles className="size-5" />
          </div>
          <h2
            id="whats-new-title"
            className="mt-4 font-display text-lg font-bold uppercase tracking-tight text-white"
          >
            {t("whatsnew.title")}
          </h2>
          <p className="mt-1 text-sm text-stone-400">{t("whatsnew.subtitle")}</p>
        </div>

        <ul className="max-h-[50vh] space-y-4 overflow-y-auto p-6">
          {changes.map((c) => (
            <li key={c.title}>
              <p className="text-sm font-semibold text-white">{c.title}</p>
              <p className="mt-0.5 text-xs text-stone-400">{c.body}</p>
            </li>
          ))}
        </ul>

        <div className="border-t border-border-subtle p-4">
          <button
            onClick={close}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-accent-foreground hover:brightness-110 active:scale-95"
          >
            {t("whatsnew.cta")}
          </button>
        </div>
      </div>
    </div>
  );
}
