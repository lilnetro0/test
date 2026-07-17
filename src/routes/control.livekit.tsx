import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HardDrive } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import { getControlLiveKitHealth } from "@/lib/control/api";
import type { AppHealthReport } from "@/lib/ops/health";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/livekit")({
  component: LiveKitHealthPage,
});

function LiveKitHealthPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const [health, setHealth] = useState<AppHealthReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    const r = await getControlLiveKitHealth({ data: { accessToken } });
    setLoading(false);
    if (!r.ok) {
      setError(r.error);
      setHealth(null);
      return;
    }
    setError(null);
    setHealth(r.health);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const lk = health?.livekit;
  const lkStatus = !lk
    ? "…"
    : !lk.configured
      ? t("control.livekit.stub")
      : lk.reachable === false
        ? t("control.livekit.down")
        : lk.reachable
          ? t("control.livekit.up")
          : t("control.livekit.unknown");

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <HardDrive className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.livekit")}
          </p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              {t("control.livekit.title")}
            </h1>
            <p className="text-sm text-stone-400">{t("control.livekit.subtitle")}</p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => void load()}
            className="rounded-lg bg-accent/20 px-3 py-1.5 text-xs font-semibold text-accent disabled:opacity-50"
          >
            {t("control.voice.refresh")}
          </button>
        </div>
      </header>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Card label={t("control.livekit.status")} value={lkStatus} />
        <Card label={t("control.livekit.host")} value={lk?.urlHost ?? "—"} mono />
        <Card
          label={t("control.livekit.probe")}
          value={
            lk?.probeMs != null ? t("control.livekit.probeMs", { ms: String(lk.probeMs) }) : "—"
          }
        />
        <Card
          label={t("control.livekit.supabase")}
          value={
            health?.supabase.ok
              ? t("control.livekit.supabaseOk", { n: String(health.supabase.games ?? 0) })
              : (health?.supabase.message ?? t("control.livekit.supabaseDown"))
          }
        />
      </div>

      {lk?.message && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {lk.message}
        </p>
      )}

      <p className="text-xs text-stone-500">{t("control.livekit.note")}</p>

      <Link to="/control/voice" className="inline-block text-xs font-semibold text-accent">
        ← {t("control.nav.voice")}
      </Link>
    </div>
  );
}

function Card({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-white/[0.03] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">{label}</p>
      <p className={`mt-1 text-sm text-white ${mono ? "font-mono" : "font-semibold"}`}>{value}</p>
    </div>
  );
}
