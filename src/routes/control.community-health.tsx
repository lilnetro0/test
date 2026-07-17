import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HeartPulse } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import {
  listControlCommunityHealth,
  type ControlCommunityHealthRow,
} from "@/lib/control/api";
import { useT, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/control/community-health")({
  component: CommunityHealthPage,
});

const FLAG_KEYS: Record<ControlCommunityHealthRow["flags"][number], TKey> = {
  tiny: "control.health.flag.tiny",
  low_members: "control.health.flag.lowMembers",
  no_voice: "control.health.flag.noVoice",
};

function CommunityHealthPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<ControlCommunityHealthRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    setLoading(true);
    void listControlCommunityHealth({ data: { accessToken, limit: 50 } }).then((r) => {
      if (cancelled) return;
      setLoading(false);
      if (!r.ok) {
        setError(r.error);
        setRows([]);
        return;
      }
      setError(null);
      setRows(r.rows);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <HeartPulse className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.communityHealth")}
          </p>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{t("control.health.title")}</h1>
        <p className="text-sm text-stone-400">{t("control.health.subtitle")}</p>
      </header>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      {loading && <p className="text-sm text-stone-500">{t("control.search.searching")}</p>}

      <ul className="overflow-hidden rounded-xl border border-border-subtle">
        {!loading && rows.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-stone-500">{t("control.health.empty")}</li>
        ) : (
          rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center gap-3 border-b border-border-subtle/60 px-3 py-2.5 last:border-0"
            >
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                  row.score < 60
                    ? "bg-red-500/20 text-red-300"
                    : row.score < 80
                      ? "bg-amber-500/20 text-amber-200"
                      : "bg-emerald-500/20 text-emerald-300",
                )}
              >
                {row.score}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  to="/control/communities/$communityId"
                  params={{ communityId: row.id }}
                  className="font-semibold text-white hover:text-accent"
                >
                  {row.name}
                </Link>
                <p className="text-xs text-stone-500">
                  {row.slug}
                  {row.region ? ` · ${row.region}` : ""}
                  {` · ${row.member_count}`}
                  {` · ${t("control.health.voiceCount", { n: String(row.voice_rooms) })}`}
                </p>
                {row.flags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {row.flags.map((f) => (
                      <span
                        key={f}
                        className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-400"
                      >
                        {t(FLAG_KEYS[f])}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <Link
                to="/control/communities/$communityId/voice"
                params={{ communityId: row.id }}
                className="text-xs font-semibold text-stone-400 hover:text-accent"
              >
                {t("control.voice.openHub")}
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
