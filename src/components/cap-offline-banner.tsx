import { useEffect, useState } from "react";
import { isNativeApp } from "@/lib/capacitor";
import { useT } from "@/lib/i18n";

/**
 * Cap remote-shell offline strip (Phase 15). Shows when navigator goes offline
 * after the WebView has already loaded the HTTPS app.
 */
export function CapOfflineBanner() {
  const { t } = useT();
  const [offline, setOffline] = useState(false);
  const [native, setNative] = useState(false);

  useEffect(() => {
    setNative(isNativeApp());
    const sync = () => setOffline(typeof navigator !== "undefined" && !navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!native || !offline) return null;

  return (
    <div
      role="status"
      className="shrink-0 border-b border-amber-500/30 bg-amber-500/15 px-3 py-2 text-center text-[11px] font-semibold text-amber-100"
    >
      {t("cap.offline")}
      <button
        type="button"
        className="ms-2 underline decoration-amber-200/80"
        onClick={() => window.location.reload()}
      >
        {t("cap.retry")}
      </button>
    </div>
  );
}
