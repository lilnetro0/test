import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

/**
 * Global keyboard nav (Vim/Linear-style "g then x" sequence + Shift+? + /).
 * - g h → home, g d → discover, g m → messages,
 *   g f → friends, g s → settings, g n → notifications, g ? → help.
 * - shift+? → help.
 * - / → focus composer (when not in a field).
 * Ignored when focus is in an input, textarea, or contenteditable.
 */
export function GlobalHotkeys() {
  const navigate = useNavigate();
  const gArmed = useRef(false);
  const gTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const inField = () => {
      const t = document.activeElement as HTMLElement | null;
      const tag = t?.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t?.isContentEditable;
    };

    const disarm = () => {
      gArmed.current = false;
      if (gTimer.current) clearTimeout(gTimer.current);
    };

    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // `/` focuses composer — only when not already typing in a field
      if (e.key === "/" && !inField() && !e.shiftKey) {
        e.preventDefault();
        window.dispatchEvent(new Event("nexus:focus-composer"));
        return;
      }

      if (inField()) return;

      // Shift+? → help
      if (e.shiftKey && e.key === "?") {
        e.preventDefault();
        navigate({ to: "/help" });
        return;
      }

      const key = e.key.toLowerCase();

      if (gArmed.current) {
        const map: Record<string, string> = {
          h: "/",
          d: "/discover",
          m: "/dm",
          f: "/friends",
          s: "/settings",
          n: "/notifications",
          "?": "/help",
        };
        const target = map[key];
        if (target) {
          e.preventDefault();
          navigate({ to: target as never });
        }
        disarm();
        return;
      }

      if (key === "g") {
        gArmed.current = true;
        gTimer.current = setTimeout(disarm, 1200);
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      if (gTimer.current) clearTimeout(gTimer.current);
    };
  }, [navigate]);

  return null;
}
