import { useEffect, type ReactNode } from "react";
import { BottomDock } from "@/components/bottom-dock";
import { DemoBanner } from "@/components/demo-banner";
import { RequireAuth } from "@/components/require-auth";

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
      <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
        <DemoBanner />
        <div id="main-content" className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
        <BottomDock onBrandClick={onBrandClick} brandActive={brandActive} />
      </div>
    </RequireAuth>
  );
}

/**
 * Slide-in bottom sheet used for contextual panels (hubs, members, filters).
 * Non-modal-looking: rounded top, glass surface. Dismiss by tapping backdrop.
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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const panelBySide: Record<typeof side, string> = {
    bottom:
      "absolute inset-x-0 bottom-0 max-h-[75vh] rounded-t-2xl border-t border-border-subtle motion-safe:animate-in motion-safe:slide-in-from-bottom-8 motion-safe:duration-200",
    right:
      "absolute inset-y-0 w-[min(340px,85vw)] border-border-subtle motion-safe:animate-in motion-safe:slide-in-from-right-8 motion-safe:duration-200 ltr:right-0 ltr:border-s rtl:left-0 rtl:border-s",
    left:
      "absolute inset-y-0 w-[min(340px,85vw)] border-border-subtle motion-safe:animate-in motion-safe:slide-in-from-left-8 motion-safe:duration-200 ltr:left-0 ltr:border-e rtl:right-0 rtl:border-e",
  };

  return (
    <div className="absolute inset-0 z-40">
      <button
        aria-label="Close panel"
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
              onClick={onClose}
              aria-label="Close"
              className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 hover:text-white"
            >
              ✕
            </button>
          </header>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
