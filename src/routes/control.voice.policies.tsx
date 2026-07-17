import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import {
  listControlVoiceRooms,
  updateControlVoiceRoomCapacity,
  type ControlVoiceRoomRow,
} from "@/lib/control/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/voice/policies")({
  component: VoicePoliciesPage,
});

function VoicePoliciesPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const [rooms, setRooms] = useState<ControlVoiceRoomRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    if (!accessToken) return;
    const r = await listControlVoiceRooms({ data: { accessToken, limit: 200 } });
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    setRooms(r.rooms);
    const next: Record<string, string> = {};
    for (const room of r.rooms) {
      next[room.id] = room.capacity != null ? String(room.capacity) : "";
    }
    setDrafts(next);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const save = async (roomId: string) => {
    if (!accessToken) return;
    setBusyId(roomId);
    const raw = drafts[roomId]?.trim() ?? "";
    const capacity = raw === "" ? null : Number(raw);
    const r = await updateControlVoiceRoomCapacity({ data: { accessToken, roomId, capacity } });
    setBusyId(null);
    if (!r.ok) toast.error(r.error);
    else {
      toast.success(t("control.voice.capacitySaved"));
      void load();
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-stone-400">{t("control.voice.policiesBody")}</p>
      <ul className="overflow-hidden rounded-xl border border-border-subtle">
        {rooms.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-stone-500">{t("control.voice.empty")}</li>
        ) : (
          rooms.map((room) => (
            <li
              key={room.id}
              className="flex flex-wrap items-center gap-2 border-b border-border-subtle/60 px-3 py-2.5 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <Link
                  to="/control/voice/rooms/$roomId"
                  params={{ roomId: room.id }}
                  className="font-semibold text-white hover:text-accent"
                >
                  {room.name}
                </Link>
                <p className="text-xs text-stone-500">{room.hub_name ?? room.hub_id}</p>
              </div>
              <input
                type="number"
                min={1}
                max={100}
                value={drafts[room.id] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [room.id]: e.target.value }))}
                placeholder={t("control.voice.uncapped")}
                className="w-24 rounded-lg border border-border-subtle bg-white/5 px-2 py-1.5 text-sm text-white"
              />
              <button
                type="button"
                disabled={busyId === room.id}
                onClick={() => void save(room.id)}
                className="rounded-lg bg-accent/20 px-3 py-1.5 text-xs font-semibold text-accent disabled:opacity-50"
              >
                {t("control.comm.save")}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
