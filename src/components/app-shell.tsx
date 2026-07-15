import { useEffect, useRef, type ReactNode } from "react";
import { BottomDock } from "@/components/bottom-dock";
import { CapOfflineBanner } from "@/components/cap-offline-banner";
import { DemoBanner } from "@/components/demo-banner";
import { RequireAuth } from "@/components/require-auth";
import { useT } from "@/lib/i18n";
import { trapFocus } from "@/lib/focus-trap";

/**
 * Universal app frame. Children fill the space above the persistent
 * bottom dock. Use on every authenticated route so navigation is
 * consistent regardless of viewport.
 */
export function AppShell({
  children,
  onBrandClick,
  brandActive,
}: {
  children: ReactNode;
  onBrandClick?: () => void;
  brandActive?: boolean;
}) {
  return (
    <RequireAuth>
      <div className="flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-background pt-safe text-foreground">
        <DemoBanner />
        <CapOfflineBanner />
        <div id="main-content" className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
        <BottomDock onBrandClick={onBrandClick} brandActive={brandActive} />
      </div>
    </RequireAuth>
  );
}

/**
 * Contextual panel (hubs, members, pins). Fixed overlay covers the dock
 * like YouMenu; bottom sheets sit above --dock-clearance (Phase 14).
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  side = "bottom",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  side?: "bottom" | "right" | "left";
}) {
  const { t } = useT();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const releaseTrap = rootRef.current ? trapFocus(rootRef.current) : () => undefined;
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      releaseTrap();
    };
  }, [open, onClose]);

  if (!open) return null;

  const panelBySide: Record<typeof side, string> = {
    bottom:
      "fixed inset-x-0 bottom-[var(--dock-clearance)] max-h-[min(75dvh,calc(100dvh-var(--dock-clearance)))] rounded-t-2xl border-t border-border-subtle motion-safe:animate-in motion-safe:slide-in-from-bottom-8 motion-safe:duration-200",
    right:
      "fixed inset-y-0 end-0 w-[min(340px,85vw)] border-s border-border-subtle motion-safe:animate-in motion-safe:slide-in-from-right-8 motion-safe:duration-200",
    left:
      "fixed inset-y-0 start-0 w-[min(340px,85vw)] border-e border-border-subtle motion-safe:animate-in motion-safe:slide-in-from-left-8 motion-safe:duration-200",
  };

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-40"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label={t("a11y.closePanel")}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className={`${panelBySide[side]} flex flex-col bg-surface-mid shadow-2xl`}>
        {title && (
          <header className="flex h-12 shrink-0 items-center justify-between border-b border-border-subtle px-4">
            <h3 className="min-w-0 truncate font-display text-xs font-bold uppercase tracking-widest text-stone-300">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("common.close")}
              className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 hover:text-white"
            >
              ✕
            </button>
          </header>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
}
