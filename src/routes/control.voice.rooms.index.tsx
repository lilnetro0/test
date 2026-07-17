import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-provider";
import { listControlVoiceRooms, type ControlVoiceRoomRow } from "@/lib/control/api";
import { useT } from "@/lib/i18n";

type Search = { q?: string };

export const Route = createFileRoute("/control/voice/rooms/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" && s.q ? s.q : undefined,
  }),
  component: VoiceRoomsPage,
});

function VoiceRoomsPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const { q: initialQ } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState(initialQ ?? "");
  const [rooms, setRooms] = useState<ControlVoiceRoomRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQ(initialQ ?? "");
  }, [initialQ]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    setLoading(true);
    void listControlVoiceRooms({ data: { accessToken, q: initialQ, limit: 100 } }).then((r) => {
      if (cancelled) return;
      setLoading(false);
      if (!r.ok) {
        setError(r.error);
        setRooms([]);
        return;
      }
      setError(null);
      setRooms(r.rooms);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, initialQ]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void navigate({ search: { q: q.trim() || undefined } });
  };

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("control.voice.searchPlaceholder")}
          className="min-w-0 flex-1 rounded-lg border border-border-subtle bg-white/5 px-3 py-2 text-sm text-white"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent/20 px-4 py-2 text-xs font-semibold text-accent"
        >
          {t("control.search.submit")}
        </button>
      </form>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      {loading && <p className="text-sm text-stone-500">{t("control.search.searching")}</p>}

      <ul className="overflow-hidden rounded-xl border border-border-subtle">
        {!loading && rooms.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-stone-500">{t("control.voice.empty")}</li>
        ) : (
          rooms.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 border-b border-border-subtle/60 px-3 py-2.5 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <Link
                  to="/control/voice/rooms/$roomId"
                  params={{ roomId: r.id }}
                  className="font-semibold text-white hover:text-accent"
                >
                  {r.name}
                </Link>
                <p className="text-xs text-stone-500">
                  {r.hub_name ?? r.hub_id}
                  {r.hub_region ? ` · ${r.hub_region}` : ""}
                  {` · ${r.livekit_room_name ?? `nexus-${r.id}`}`}
                  {r.capacity != null ? ` · ${r.capacity}` : ` · ${t("control.voice.uncapped")}`}
                </p>
              </div>
              <Link
                to="/control/communities/$communityId/voice"
                params={{ communityId: r.hub_id }}
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
