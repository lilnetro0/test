import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import { adminListGames, adminListHubs, adminUploadHubMedia } from "@/lib/admin/api";
import { fileToBase64 } from "@/lib/control/media";
import type { GameArtworkSlot } from "@/lib/game-artwork";
import { HUB_MEDIA_ACCEPT } from "@/lib/supabase/storage-policy";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/media")({
  component: MediaLibraryPage,
});

/** Media Library v1 — upload to hub-media and optionally attach to game/hub. */
function MediaLibraryPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const [games, setGames] = useState<Array<{ id: string; name: string }>>([]);
  const [hubs, setHubs] = useState<Array<{ id: string; name: string }>>([]);
  const [target, setTarget] = useState<"none" | "game" | "hub">("none");
  const [targetId, setTargetId] = useState("");
  const [slot, setSlot] = useState<GameArtworkSlot>("cover");
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    void Promise.all([
      adminListGames({ data: { accessToken } }),
      adminListHubs({ data: { accessToken } }),
    ]).then(([g, h]) => {
      if (g.ok) {
        setGames((g.games as Array<{ id: string; name: string }>).map((x) => ({ id: x.id, name: x.name })));
      }
      if (h.ok) {
        setHubs((h.hubs as Array<{ id: string; name: string }>).map((x) => ({ id: x.id, name: x.name })));
      }
    });
  }, [accessToken]);

  const upload = async (file: File | null) => {
    if (!file || !accessToken) return;
    setBusy(true);
    const { base64, contentType } = await fileToBase64(file);
    const attachTo =
      target === "game" && targetId
        ? { kind: "game" as const, id: targetId }
        : target === "hub" && targetId
          ? { kind: "hub" as const, id: targetId }
          : undefined;
    const r = await adminUploadHubMedia({
      data: {
        accessToken,
        base64,
        contentType,
        slot: target === "game" ? slot : undefined,
        attachTo,
      },
    });
    setBusy(false);
    if (!r.ok) toast.error(r.error);
    else {
      setLastUrl(r.url);
      toast.success(t("control.media.uploaded"));
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 p-4 md:p-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <ImageIcon className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.group.work")}
          </p>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{t("control.media.title")}</h1>
        <p className="text-sm text-stone-400">{t("control.media.subtitle")}</p>
      </header>

      <div className="space-y-3 rounded-xl border border-border-subtle p-4">
        <label className="block space-y-1 text-xs text-stone-400">
          {t("control.media.attach")}
          <select
            value={target}
            onChange={(e) => {
              setTarget(e.target.value as typeof target);
              setTargetId("");
            }}
            className={inputCls}
          >
            <option value="none">{t("control.media.attachNone")}</option>
            <option value="game">{t("control.media.attachGame")}</option>
            <option value="hub">{t("control.media.attachHub")}</option>
          </select>
        </label>
        {target === "game" && (
          <>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className={inputCls}
            >
              <option value="">{t("control.media.pick")}</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value as GameArtworkSlot)}
              className={inputCls}
            >
              <option value="cover">cover</option>
              <option value="banner">banner</option>
              <option value="icon">icon</option>
              <option value="background">background</option>
            </select>
          </>
        )}
        {target === "hub" && (
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className={inputCls}
          >
            <option value="">{t("control.media.pick")}</option>
            {hubs.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        )}
        <input
          type="file"
          accept={HUB_MEDIA_ACCEPT}
          disabled={busy}
          onChange={(e) => void upload(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-stone-300"
        />
        {lastUrl && (
          <div className="space-y-2">
            <p className="break-all font-mono text-[10px] text-stone-500">{lastUrl}</p>
            <img src={lastUrl} alt="" className="max-h-40 rounded-lg object-cover" />
            {target === "game" && targetId && (
              <Link
                to="/control/games/$gameId/artwork"
                params={{ gameId: targetId }}
                className="text-xs font-semibold text-accent"
              >
                {t("control.media.openArtwork")}
              </Link>
            )}
            {target === "hub" && targetId && (
              <Link
                to="/control/communities/$communityId/settings"
                params={{ communityId: targetId }}
                className="text-xs font-semibold text-accent"
              >
                {t("control.media.openCommunity")}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-border-subtle bg-white/5 px-3 py-2 text-sm text-white";
