import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import {
  adminApplyMenaChannelTemplate,
  adminDeleteTextChannel,
  adminListChannels,
  adminUpsertTextChannel,
} from "@/lib/admin/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/communities/$communityId/channels")({
  component: CommunityChannelsPage,
});

type TextCh = { id: string; name: string; slug: string; topic: string | null; position: number };

function CommunityChannelsPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const { communityId } = Route.useParams();
  const [text, setText] = useState<TextCh[]>([]);
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    const r = await adminListChannels({ data: { accessToken, hubId: communityId } });
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    setText(r.text as TextCh[]);
  }, [accessToken, communityId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken || !name.trim()) return;
    setBusy(true);
    const r = await adminUpsertTextChannel({
      data: {
        accessToken,
        channel: { hub_id: communityId, name: name.trim(), topic: topic || null },
      },
    });
    setBusy(false);
    if (!r.ok) toast.error(r.error);
    else {
      toast.success(t("control.comm.channelAdded"));
      setName("");
      setTopic("");
      void refresh();
    }
  };

  const applyTemplate = async () => {
    if (!accessToken) return;
    setBusy(true);
    const r = await adminApplyMenaChannelTemplate({ data: { accessToken, hubId: communityId } });
    setBusy(false);
    if (!r.ok) toast.error(r.error);
    else {
      toast.success(t("control.comm.templateApplied", { n: String(r.created) }));
      void refresh();
    }
  };

  const remove = async (id: string) => {
    if (!accessToken) return;
    const r = await adminDeleteTextChannel({ data: { accessToken, channelId: id } });
    if (!r.ok) toast.error(r.error);
    else {
      toast.success(t("control.comm.channelDeleted"));
      void refresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void applyTemplate()}
          className="rounded-md bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent disabled:opacity-50"
        >
          {t("control.comm.applyTemplate")}
        </button>
      </div>

      <form onSubmit={(e) => void add(e)} className="flex flex-wrap gap-2 rounded-xl border border-border-subtle p-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("control.comm.channelName")}
          className="min-w-[10rem] flex-1 rounded-lg border border-border-subtle bg-white/5 px-3 py-2 text-sm text-white"
          dir="auto"
        />
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={t("control.comm.channelTopic")}
          className="min-w-[10rem] flex-1 rounded-lg border border-border-subtle bg-white/5 px-3 py-2 text-sm text-white"
          dir="auto"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-accent/20 px-3 py-2 text-xs font-semibold text-accent disabled:opacity-50"
        >
          {t("control.comm.addChannel")}
        </button>
      </form>

      <ul className="overflow-hidden rounded-xl border border-border-subtle">
        {text.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-stone-500">{t("control.comm.noText")}</li>
        ) : (
          text.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-2 border-b border-border-subtle/60 px-3 py-2.5 last:border-0"
            >
              <div>
                <p className="font-semibold text-white">#{c.name}</p>
                <p className="text-xs text-stone-500">
                  {c.slug}
                  {c.topic ? ` · ${c.topic}` : ""}
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
