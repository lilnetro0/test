import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, HeartPulse } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import {
  getControlSystemBoard,
  type ControlSystemBoard,
  type ControlSystemDependency,
} from "@/lib/control/api";
import { useT, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/control/system")({
  component: SystemHealthPage,
});

const DEP_KEYS: Record<ControlSystemDependency["id"], TKey> = {
  supabase: "control.system.dep.supabase",
  service_role: "control.system.dep.serviceRole",
  livekit: "control.system.dep.livekit",
  storage: "control.system.dep.storage",
  ops_webhook: "control.system.dep.opsWebhook",
  pagerduty: "control.system.dep.pagerduty",
};

const STATUS_KEYS: Record<ControlSystemDependency["status"], TKey> = {
  ok: "control.system.status.ok",
  warn: "control.system.status.warn",
  down: "control.system.status.down",
  off: "control.system.status.off",
};

function SystemHealthPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const [board, setBoard] = useState<ControlSystemBoard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    const r = await getControlSystemBoard({ data: { accessToken } });
    setLoading(false);
    if (!r.ok) {
      setError(r.error);
      setBoard(null);
      return;
    }
    setError(null);
    setBoard(r.board);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <HeartPulse className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.health")}
          </p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">{t("control.system.title")}</h1>
            <p className="text-sm text-stone-400">{t("control.system.subtitle")}</p>
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

      {board && (
        <>
          <div
            className={cn(
              "rounded-xl border px-4 py-3 text-sm font-semibold",
              board.healthOk
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                : "border-red-500/40 bg-red-500/10 text-red-200",
            )}
          >
            {board.healthOk ? t("control.system.ready") : t("control.system.notReady")}
            <span className="ms-2 font-normal text-stone-400">
              {board.env} · {new Date(board.generatedAt).toLocaleString()}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/control/moderation"
              className="rounded-xl border border-border-subtle bg-white/[0.03] p-4 hover:border-accent/40"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">
                {t("control.dash.kpi.openReports")}
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-white">{board.openReports}</p>
            </Link>
            <Link
              to="/control/voice"
              className="rounded-xl border border-border-subtle bg-white/[0.03] p-4 hover:border-accent/40"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">
                {t("control.dash.kpi.voice")}
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-white">{board.voiceRooms}</p>
            </Link>
          </div>

          <ul className="overflow-hidden rounded-xl border border-border-subtle">
            {board.dependencies.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center gap-3 border-b border-border-subtle/60 px-3 py-2.5 last:border-0"
              >
                <Activity
                  className={cn(
                    "size-4",
                    d.status === "ok"
                      ? "text-emerald-400"
                      : d.status === "down"
                        ? "text-red-400"
                        : d.status === "warn"
                          ? "text-amber-300"
                          : "text-stone-500",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">{t(DEP_KEYS[d.id])}</p>
                  {d.detail && <p className="font-mono text-xs text-stone-500">{d.detail}</p>}
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  {t(STATUS_KEYS[d.status])}
                </span>
                {d.href === "/control/livekit" && (
                  <Link to="/control/livekit" className="text-xs font-semibold text-accent">
                    {t("control.nav.livekit")}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
