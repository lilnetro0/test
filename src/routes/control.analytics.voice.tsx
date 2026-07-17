import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-provider";
import {
  getControlAnalyticsOverview,
  getControlVoiceOverview,
  type ControlAnalyticsOverview,
  type ControlVoiceOverview,
} from "@/lib/control/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/analytics/voice")({
  component: AnalyticsVoicePage,
});

function AnalyticsVoicePage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const [overview, setOverview] = useState<ControlAnalyticsOverview | null>(null);
  const [voice, setVoice] = useState<ControlVoiceOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void Promise.all([
      getControlAnalyticsOverview({ data: { accessToken, rangeDays: 7 } }),
      getControlVoiceOverview({ data: { accessToken } }),
    ]).then(([a, b]) => {
      if (cancelled) return;
      if (!a.ok) {
        setError(a.error);
        return;
      }
      if (!b.ok) {
        setError(b.error);
        return;
      }
      setError(null);
      setOverview(a.overview);
      setVoice(b.overview);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-400">{t("control.analytics.voiceBody")}</p>
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card label={t("control.voice.stat.rooms")} value={voice?.roomCount} />
        <Card label={t("control.voice.stat.hubs")} value={voice?.hubsWithVoice} />
        <Card label={t("control.voice.stat.uncapped")} value={voice?.uncappedRooms} />
      </div>
      <div className="rounded-xl border border-border-subtle p-4 text-sm text-stone-400">
        <p>
          {t("control.analytics.kpi.usersTotal")}:{" "}
          <span className="font-semibold text-white">
            {overview?.usersTotal?.toLocaleString() ?? "—"}
          </span>
        </p>
        <p className="mt-2 text-xs">{t("control.analytics.voiceMinutesNote")}</p>
      </div>
      <div className="flex flex-wrap gap-3 text-xs font-semibold">
        <Link to="/control/live" className="text-accent">
          {t("control.nav.live")} →
        </Link>
        <Link to="/control/voice" className="text-stone-400 hover:text-accent">
          {t("control.nav.voice")} →
        </Link>
        <Link to="/control/livekit" className="text-stone-400 hover:text-accent">
          {t("control.nav.livekit")} →
        </Link>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-white/[0.03] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-white">
        {value == null ? "—" : value.toLocaleString()}
      </p>
    </div>
  );
}
