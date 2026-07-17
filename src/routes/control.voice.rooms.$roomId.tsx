import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import { adminDeleteVoiceChannel } from "@/lib/admin/api";
import {
  getControlVoiceRoom,
  kickControlVoiceParticipant,
  updateControlVoiceRoomCapacity,
  type ControlVoiceRoomDetail,
} from "@/lib/control/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/voice/rooms/$roomId")({
  component: VoiceRoomDetailPage,
});

function VoiceRoomDetailPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const { roomId } = Route.useParams();
  const navigate = Route.useNavigate();
  const [room, setRoom] = useState<ControlVoiceRoomDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capacity, setCapacity] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!accessToken) return;
    const r = await getControlVoiceRoom({ data: { accessToken, roomId } });
    if (!r.ok) {
      setError(r.error);
      setRoom(null);
      return;
    }
    setError(null);
    setRoom(r.room);
    setCapacity(r.room.capacity != null ? String(r.room.capacity) : "");
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, roomId]);

  const saveCapacity = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setBusy(true);
    const value = capacity.trim() === "" ? null : Number(capacity);
    const r = await updateControlVoiceRoomCapacity({
      data: { accessToken, roomId, capacity: value },
    });
    setBusy(false);
    if (!r.ok) toast.error(r.error);
    else {
      toast.success(t("control.voice.capacitySaved"));
      void load();
    }
  };

  const kick = async (identity: string) => {
    if (!accessToken || !room) return;
    if (!window.confirm(t("control.voice.kickConfirm", { name: identity }))) return;
    setBusy(true);
    const r = await kickControlVoiceParticipant({
      data: {
        accessToken,
        roomId,
        identity,
        roomName: room.livekit_room_name ?? undefined,
      },
    });
    setBusy(false);
    if (!r.ok) toast.error(r.error);
    else {
      toast.success(t("control.voice.kicked"));
      void load();
    }
  };

  const remove = async () => {
    if (!accessToken || !room) return;
    if (!window.confirm(t("control.voice.deleteConfirm", { name: room.name }))) return;
    setBusy(true);
    const r = await adminDeleteVoiceChannel({ data: { accessToken, channelId: roomId } });
    setBusy(false);
    if (!r.ok) toast.error(r.error);
    else {
      toast.success(t("control.voice.deleted"));
      void navigate({ to: "/control/voice/rooms" });
    }
  };

  if (error) {
    return (
      <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
        {error}
      </p>
    );
  }
  if (!room) {
    return <p className="text-sm text-stone-500">{t("control.search.searching")}</p>;
  }

  const roomName = room.livekit_room_name?.trim() || `nexus-${room.id}`;

  return (
    <div className="space-y-4">
      <Link to="/control/voice/rooms" className="text-xs font-semibold text-accent">
        ← {t("control.voice.tab.rooms")}
      </Link>

      <div className="space-y-1">
        <h2 className="font-display text-xl font-bold text-white">{room.name}</h2>
        <p className="text-xs text-stone-500">
          {room.hub_name ?? room.hub_id}
          {room.hub_region ? ` · ${room.hub_region}` : ""} · {roomName}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <Link
          to="/control/communities/$communityId/voice"
          params={{ communityId: room.hub_id }}
          className="font-semibold text-accent"
        >
          {t("control.voice.openHub")}
        </Link>
        {room.hub_slug && (
          <a href={`/c/${room.hub_slug}`} className="font-semibold text-stone-400 hover:text-accent">
            {t("control.search.openHub")}
          </a>
        )}
      </div>

      <form onSubmit={saveCapacity} className="space-y-2 rounded-xl border border-border-subtle p-4">
        <label className="block text-xs font-semibold text-stone-400">
          {t("control.voice.capacity")}
          <input
            type="number"
            min={1}
            max={100}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder={t("control.voice.uncapped")}
            className="mt-1 w-full rounded-lg border border-border-subtle bg-white/5 px-3 py-2 text-sm text-white"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-accent/20 px-4 py-2 text-xs font-semibold text-accent disabled:opacity-50"
        >
          {t("control.comm.save")}
        </button>
      </form>

      <section className="space-y-2 rounded-xl border border-border-subtle p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-white">{t("control.voice.liveRoster")}</h3>
          <button
            type="button"
            onClick={() => void load()}
            className="text-xs font-semibold text-accent"
          >
            {t("control.voice.refresh")}
          </button>
        </div>
        {!room.live.configured ? (
          <p className="text-sm text-stone-500">{t("control.livekit.stub")}</p>
        ) : room.live.members.length === 0 ? (
          <p className="text-sm text-stone-500">{t("control.voice.noParticipants")}</p>
        ) : (
          <ul className="divide-y divide-border-subtle/60">
            {room.live.members.map((m) => (
              <li key={m.userId} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{m.name}</p>
                  <p className="font-mono text-[10px] text-stone-500">{m.userId}</p>
                </div>
                {m.muted && (
                  <span className="text-[10px] font-semibold uppercase text-amber-400">
                    {t("control.voice.muted")}
                  </span>
                )}
                <Link
                  to="/control/users/$userId"
                  params={{ userId: m.userId }}
                  className="text-xs font-semibold text-stone-400 hover:text-accent"
                >
                  {t("control.search.openUser")}
                </Link>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void kick(m.userId)}
                  className="text-xs font-semibold text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  {t("control.voice.kick")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        type="button"
        disabled={busy}
        onClick={() => void remove()}
        className="rounded-lg border border-red-500/40 px-4 py-2 text-xs font-semibold text-red-300 disabled:opacity-50"
      >
        {t("control.comm.delete")}
      </button>
    </div>
  );
}
