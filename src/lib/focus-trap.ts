/**
 * Thin focus containment for overlays (Phase 14 follow-up).
 * Moves Tab cycling to focusable descendants; focuses first control on mount.
 */
export function trapFocus(container: HTMLElement): () => void {
  const selector =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const focusables = () =>
    Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
      (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1 && el.offsetParent !== null,
    );

  const initial = focusables();
  const prev = document.activeElement as HTMLElement | null;
  (initial[0] ?? container).focus?.();

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const list = focusables();
    if (list.length === 0) {
      e.preventDefault();
      return;
    }
    const first = list[0]!;
    const last = list[list.length - 1]!;
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey) {
      if (active === first || !container.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else if (active === last || !container.contains(active)) {
      e.preventDefault();
      first.focus();
    }
  };

  container.addEventListener("keydown", onKeyDown);
  return () => {
    container.removeEventListener("keydown", onKeyDown);
    prev?.focus?.();
  };
}
