import { useEffect } from "react";

/**
 * Global hotkey hook. Fires the callback when the given combination is pressed
 * anywhere in the document, unless focus is inside a form field (unless
 * `allowInInputs` is true).
 *
 * Combo format: "mod+k", "esc", "/", "shift+?"
 * - "mod" resolves to Cmd on macOS, Ctrl elsewhere.
 */
export function useHotkey(
  combo: string,
  onFire: (e: KeyboardEvent) => void,
  { allowInInputs = false }: { allowInInputs?: boolean } = {},
) {
  useEffect(() => {
    const parts = combo.toLowerCase().split("+").map((p) => p.trim());
    const key = parts[parts.length - 1];
    const needMod = parts.includes("mod");
    const needShift = parts.includes("shift");
    const needAlt = parts.includes("alt");

    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (needMod !== mod) return;
      if (needShift !== e.shiftKey) return;
      if (needAlt !== e.altKey) return;
      if (e.key.toLowerCase() !== key) return;

      if (!allowInInputs) {
        const t = e.target as HTMLElement | null;
        const tag = t?.tagName;
        const editable = t?.isContentEditable;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || editable) return;
      }

      e.preventDefault();
      onFire(e);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [combo, onFire, allowInInputs]);
}
