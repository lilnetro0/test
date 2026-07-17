import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, HardDrive, Radio } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import { getControlVoiceOverview, type ControlVoiceOverview } from "@/lib/control/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/voice/")({
  component: VoiceOverviewPage,
});

function VoiceOverviewPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const [overview, setOverview] = useState<ControlVoiceOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void getControlVoiceOverview({ data: { accessToken } }).then((r) => {
      if (cancelled) return;
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setOverview(r.overview);
      setError(null);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const lkLabel = !overview
    ? "…"
    : !overview.livekitConfigured
      ? t("control.livekit.stub")
      : overview.livekitReachable === false
        ? t("control.livekit.down")
        : overview.livekitReachable
          ? t("control.livekit.up")
          : t("control.livekit.unknown");

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={t("control.voice.stat.rooms")} value={overview?.roomCount ?? "—"} />
        <Stat label={t("control.voice.stat.hubs")} value={overview?.hubsWithVoice ?? "—"} />
        <Stat label={t("control.voice.stat.uncapped")} value={overview?.uncappedRooms ?? "—"} />
      </div>

      <div className="rounded-xl border border-border-subtle bg-white/[0.03] p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
          {t("control.nav.livekit")}
        </p>
        <p className="mt-1 text-sm text-white">{lkLabel}</p>
        {overview?.livekitHost && (
          <p className="mt-1 font-mono text-xs text-stone-500">{overview.livekitHost}</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <QuickLink
          to="/control/voice/rooms"
          icon={Radio}
          title={t("control.voice.tab.rooms")}
          body={t("control.voice.roomsHint")}
        />
        <QuickLink
          to="/control/live"
          icon={Activity}
          title={t("control.nav.live")}
          body={t("control.voice.liveHint")}
        />
        <QuickLink
          to="/control/livekit"
          icon={HardDrive}
          title={t("control.nav.livekit")}
          body={t("control.voice.livekitHint")}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-white/[0.03] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function QuickLink({
  to,
  icon: Icon,
  title,
  body,
}: {
  to: "/control/voice/rooms" | "/control/live" | "/control/livekit";
  icon: typeof Radio;
  title: string;
  body: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-border-subtle bg-white/[0.03] p-4 transition-colors hover:border-accent/40 hover:bg-accent/5"
    >
      <Icon className="mb-2 size-4 text-accent" />
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs text-stone-400">{body}</p>
    </Link>
  );
}
