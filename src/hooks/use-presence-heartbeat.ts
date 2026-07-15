import { useEffect, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { shouldUseMockData } from "@/lib/supabase/env";

const IDLE_MS = 5 * 60 * 1000;

export type PresenceStatus = "online" | "idle" | "dnd" | "offline";

/**
 * Presence heartbeat. When `lockedStatus` is `dnd`, auto online/idle/offline is skipped
 * until the user picks another status (e.g. from /me).
 */
export function usePresenceHeartbeat(
  enabled: boolean,
  lockedStatus?: string | null,
) {
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusRef = useRef<string | null>(null);
  const lockedRef = useRef(lockedStatus);
  lockedRef.current = lockedStatus;

  useEffect(() => {
    if (!enabled || shouldUseMockData()) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;

    let cancelled = false;

    const setStatus = (status: PresenceStatus) => {
      if (cancelled) return;
      if (lockedRef.current === "dnd" && status !== "dnd") return;
      if (statusRef.current === status) return;
      statusRef.current = status;
      void client.rpc("set_presence", { p_status: status });
    };

    // Sync local ref when profile is already dnd
    if (lockedRef.current === "dnd") {
      statusRef.current = "dnd";
      return;
    }

    const bumpOnline = () => {
      if (lockedRef.current === "dnd") return;
      if (document.visibilityState !== "visible") return;
      setStatus("online");
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setStatus("idle"), IDLE_MS);
    };

    const onVisibility = () => {
      if (lockedRef.current === "dnd") return;
      if (document.visibilityState === "hidden") setStatus("offline");
      else bumpOnline();
    };

    const onUnload = () => {
      if (lockedRef.current === "dnd") return;
      void client.rpc("set_presence", { p_status: "offline" });
    };

    bumpOnline();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointerdown", bumpOnline);
    window.addEventListener("keydown", bumpOnline);
    window.addEventListener("pagehide", onUnload);

    return () => {
      cancelled = true;
      if (idleTimer.current) clearTimeout(idleTimer.current);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointerdown", bumpOnline);
      window.removeEventListener("keydown", bumpOnline);
      window.removeEventListener("pagehide", onUnload);
      if (lockedRef.current !== "dnd") {
        void client.rpc("set_presence", { p_status: "offline" });
      }
    };
  }, [enabled, lockedStatus]);
}
