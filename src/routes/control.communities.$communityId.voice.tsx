import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import {
  adminDeleteVoiceChannel,
  adminListChannels,
  adminUpsertVoiceChannel,
} from "@/lib/admin/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/communities/$communityId/voice")({
  component: CommunityVoicePage,
});

type VoiceCh = {
  id: string;
  name: string;
  slug: string;
  capacity: number;
  livekit_room_name: string | null;
};

function CommunityVoicePage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const { communityId } = Route.useParams();
  const [voice, setVoice] = useState<VoiceCh[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    const r = await adminListChannels({ data: { accessToken, hubId: communityId } });
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    setVoice(r.voice as VoiceCh[]);
  }, [accessToken, communityId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken || !name.trim()) return;
    setBusy(true);
    const r = await adminUpsertVoiceChannel({
      data: { accessToken, channel: { hub_id: communityId, name: name.trim() } },
    });
    setBusy(false);
    if (!r.ok) toast.error(r.error);
    else {
      toast.success(t("control.comm.voiceAdded"));
      setName("");
      void refresh();
    }
  };

  const remove = async (id: string) => {
    if (!accessToken) return;
    const r = await adminDeleteVoiceChannel({ data: { accessToken, channelId: id } });
    if (!r.ok) toast.error(r.error);
    else {
      toast.success(t("control.comm.channelDeleted"));
      void refresh();
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => void add(e)} className="flex gap-2 rounded-xl border border-border-subtle p-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("control.comm.voiceName")}
          className="min-w-0 flex-1 rounded-lg border border-border-subtle bg-white/5 px-3 py-2 text-sm text-white"
          dir="auto"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-accent/20 px-3 py-2 text-xs font-semibold text-accent disabled:opacity-50"
        >
          {t("control.comm.addVoice")}
        </button>
      </form>

      <ul className="overflow-hidden rounded-xl border border-border-subtle">
        {voice.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-stone-500">{t("control.comm.noVoice")}</li>
        ) : (
          voice.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-2 border-b border-border-subtle/60 px-3 py-2.5 last:border-0"
            >
              <div>
                <p className="font-semibold text-white">{c.name}</p>
                <p className="text-xs text-stone-500">
                  {c.slug} · cap {c.capacity}
                  {c.livekit_room_name ? ` · ${c.livekit_room_name}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void remove(c.id)}
                className="text-[10px] font-bold uppercase text-red-300"
              >
                {t("control.comm.delete")}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
