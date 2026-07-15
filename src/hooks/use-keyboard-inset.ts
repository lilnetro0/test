import { useEffect } from "react";
import { isNativeApp } from "@/lib/capacitor";

const OPEN_THRESHOLD_PX = 48;

/**
 * Keeps `--keyboard-inset` + `data-keyboard-open` in sync so composer stays
 * visible while the soft keyboard is up.
 * - Web: visualViewport delta
 * - Cap: Keyboard plugin heights (Body resize already shrinks the webview —
 *   we only use plugin events to hide the dock / tweak clearance, not double-pad)
 */
export function useKeyboardInset(): void {
  useEffect(() => {
    const root = document.documentElement;
    let capCleanup: (() => void) | undefined;
    const native = isNativeApp();

    const applyInset = (px: number) => {
      const inset = Math.max(0, Math.round(px));
      root.style.setProperty("--keyboard-inset", `${inset}px`);
      if (inset >= OPEN_THRESHOLD_PX) root.dataset.keyboardOpen = "1";
      else delete root.dataset.keyboardOpen;
    };

    if (native) {
      // Cap KeyboardResize.Body owns layout height; only flag open state for dock hide.
      void import("@capacitor/keyboard")
        .then(({ Keyboard }) => {
          const show = Keyboard.addListener("keyboardWillShow", () => {
            applyInset(OPEN_THRESHOLD_PX);
          });
          const hide = Keyboard.addListener("keyboardWillHide", () => {
            applyInset(0);
          });
          capCleanup = () => {
            void show.then((h) => h.remove());
            void hide.then((h) => h.remove());
          };
        })
        .catch(() => {
          /* plugin optional — fall through to visualViewport below */
        });
    }

    const fromViewport = () => {
      if (native && root.dataset.keyboardOpen === "1") return;
      const vv = window.visualViewport;
      if (!vv) {
        if (!native) applyInset(0);
        return;
      }
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      applyInset(inset);
    };

    if (!native) {
      fromViewport();
      const vv = window.visualViewport;
      vv?.addEventListener("resize", fromViewport);
      vv?.addEventListener("scroll", fromViewport);
      window.addEventListener("orientationchange", fromViewport);
      return () => {
        vv?.removeEventListener("resize", fromViewport);
        vv?.removeEventListener("scroll", fromViewport);
        window.removeEventListener("orientationchange", fromViewport);
        root.style.removeProperty("--keyboard-inset");
        delete root.dataset.keyboardOpen;
      };
    }

    // Native: still listen to visualViewport as backup if plugin missing
    const vv = window.visualViewport;
    vv?.addEventListener("resize", fromViewport);
    vv?.addEventListener("scroll", fromViewport);
    return () => {
      vv?.removeEventListener("resize", fromViewport);
      vv?.removeEventListener("scroll", fromViewport);
      capCleanup?.();
      root.style.removeProperty("--keyboard-inset");
      delete root.dataset.keyboardOpen;
    };
  }, []);
}
