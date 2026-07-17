import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { shouldUseMockData } from "@/lib/supabase/env";
import {
  fetchPlatformNoticesCached,
  type PublicAnnouncement,
} from "@/lib/control/public";

const DISMISS_PREFIX = "nexus.announcement.dismissed.";

function isDismissed(id: string): boolean {
  try {
    return window.localStorage.getItem(DISMISS_PREFIX + id) === "1";
  } catch {
    return false;
  }
}

/**
 * Global consumer strips driven by Nexus Control:
 * - maintenance banner (control_feature_flags: maintenance.banner)
 * - latest published announcement matching the UI language (dismissible)
 */
export function PlatformNotices() {
  const { t, lang } = useT();
  const [maintenance, setMaintenance] = useState(false);
  const [announcement, setAnnouncement] = useState<PublicAnnouncement | null>(null);

  useEffect(() => {
    if (shouldUseMockData()) return;
    let cancelled = false;
    void fetchPlatformNoticesCached().then((notices) => {
      if (cancelled) return;
      setMaintenance(notices.maintenance);
      const next = notices.announcements.find(
        (a) => (a.locale === "both" || a.locale === lang) && !isDismissed(a.id),
      );
      setAnnouncement(next ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const dismiss = () => {
    if (announcement) {
      try {
        window.localStorage.setItem(DISMISS_PREFIX + announcement.id, "1");
      } catch {
        /* ignore */
      }
    }
    setAnnouncement(null);
  };

  if (!maintenance && !announcement) return null;

  return (
    <>
      {maintenance ? (
        <div
          role="status"
          className="shrink-0 border-b border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-center text-[11px] font-semibold text-amber-100"
        >
          {t("notice.maintenance")}
        </div>
      ) : null}
      {announcement ? (
        <div
          role="status"
          className="flex shrink-0 items-center gap-2 border-b border-accent/25 bg-accent/10 px-3 py-1.5 text-[11px] text-accent-foreground"
        >
          <Megaphone className="size-3.5 shrink-0 text-accent" />
          <p className="min-w-0 flex-1 truncate" dir="auto">
            <span className="font-bold text-white">{announcement.title}</span>
            {announcement.body ? (
              <span className="ms-2 text-stone-300">{announcement.body}</span>
            ) : null}
          </p>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t("notice.dismiss")}
            className="grid size-6 shrink-0 place-items-center rounded-md text-stone-400 hover:bg-white/10 hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : null}
    </>
  );
}
