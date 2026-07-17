import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import { listControlLiveSessions, type ControlLiveSession } from "@/lib/control/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/live")({
  component: LiveSessionsPage,
});

function LiveSessionsPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const [sessions, setSessions] = useState<ControlLiveSession[]>([]);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    const r = await listControlLiveSessions({ data: { accessToken } });
    setLoading(false);
    if (!r.ok) {
      setError(r.error);
      setSessions([]);
      return;
    }
    setConfigured(r.configured);
    setSessions(r.sessions);
    setError(r.error ?? null);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <Activity className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.live")}
          </p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">{t("control.live.title")}</h1>
            <p className="text-sm text-stone-400">{t("control.live.subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg bg-accent/20 px-3 py-1.5 text-xs font-semibold text-accent"
          >
            {t("control.voice.refresh")}
          </button>
        </div>
      </header>

      {error && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {error}
        </p>
      )}

      {!configured ? (
        <p className="rounded-xl border border-dashed border-border-subtle p-6 text-center text-sm text-stone-400">
          {t("control.livekit.stub")}
        </p>
      ) : loading ? (
        <p className="text-sm text-stone-500">{t("control.search.searching")}</p>
      ) : sessions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-subtle p-6 text-center text-sm text-stone-400">
          {t("control.live.empty")}
        </p>
      ) : (
        <ul className="overflow-hidden rounded-xl border border-border-subtle">
          {sessions.map((s) => (
            <li
              key={s.roomName}
              className="flex flex-wrap items-center gap-3 border-b border-border-subtle/60 px-3 py-2.5 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">{s.channelName ?? s.roomName}</p>
                <p className="text-xs text-stone-500">
                  {s.hubName ?? t("control.live.unknownHub")}
                  {` · ${s.numParticipants}`}
                  {s.capacity != null ? ` / ${s.capacity}` : ""}
                  {` · ${s.roomName}`}
                </p>
              </div>
              {s.channelId && (
                <Link
                  to="/control/voice/rooms/$roomId"
                  params={{ roomId: s.channelId }}
                  className="text-xs font-semibold text-accent"
                >
                  {t("control.live.openRoom")}
                </Link>
              )}
              {s.hubId && (
                <Link
                  to="/control/communities/$communityId/voice"
                  params={{ communityId: s.hubId }}
                  className="text-xs font-semibold text-stone-400 hover:text-accent"
                >
                  {t("control.voice.openHub")}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
