import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import { adminUploadHubMedia, adminUpsertGame } from "@/lib/admin/api";
import { getControlGame, type ControlGameDetail } from "@/lib/control/api";
import { fileToBase64 } from "@/lib/control/media";
import type { GameArtworkSlot } from "@/lib/game-artwork";
import { HUB_MEDIA_ACCEPT } from "@/lib/supabase/storage-policy";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/games/$gameId/artwork")({
  component: GameArtworkPage,
});

const SLOTS: { slot: GameArtworkSlot; labelKey: "control.games.slot.cover" | "control.games.slot.banner" | "control.games.slot.icon" | "control.games.slot.background"; urlKey: keyof ControlGameDetail }[] = [
  { slot: "cover", labelKey: "control.games.slot.cover", urlKey: "image_url" },
  { slot: "banner", labelKey: "control.games.slot.banner", urlKey: "banner_url" },
  { slot: "icon", labelKey: "control.games.slot.icon", urlKey: "icon_url" },
  { slot: "background", labelKey: "control.games.slot.background", urlKey: "background_url" },
];

function GameArtworkPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const { gameId } = Route.useParams();
  const [game, setGame] = useState<ControlGameDetail | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!accessToken) return;
    const r = await getControlGame({ data: { accessToken, gameId } });
    if (r.ok) setGame(r.game);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, gameId]);

  const upload = async (slot: GameArtworkSlot, file: File | null) => {
    if (!file || !accessToken || !game) return;
    setBusy(true);
    const { base64, contentType } = await fileToBase64(file);
    const r = await adminUploadHubMedia({
      data: {
        accessToken,
        base64,
        contentType,
        slot,
        attachTo: { kind: "game", id: game.id },
      },
    });
    setBusy(false);
    if (!r.ok) toast.error(r.error);
    else {
      toast.success(t("control.games.artUploaded"));
      void load();
    }
  };

  const clear = async (slot: GameArtworkSlot) => {
    if (!accessToken || !game) return;
    setBusy(true);
    const patch = {
      id: game.id,
      name: game.name,
      short: game.short,
      category: game.category,
      tint: game.tint,
      text_tint: game.text_tint,
      image_url: game.image_url,
      banner_url: game.banner_url,
      background_url: game.background_url,
      icon_url: game.icon_url,
    };
    if (slot === "cover") patch.image_url = null;
    if (slot === "banner") patch.banner_url = null;
    if (slot === "icon") patch.icon_url = null;
    if (slot === "background") patch.background_url = null;
    const r = await adminUpsertGame({ data: { accessToken, game: patch } });
    setBusy(false);
    if (!r.ok) toast.error(r.error);
    else {
      toast.success(t("control.games.artCleared"));
      void load();
    }
  };

  if (!game) return <p className="text-sm text-stone-500">{t("control.checking")}</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {SLOTS.map(({ slot, labelKey, urlKey }) => {
        const url = game[urlKey] as string | null;
        return (
          <div key={slot} className="space-y-2 rounded-xl border border-border-subtle p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              {t(labelKey)}
            </p>
            {url ? (
              <img src={url} alt="" className="h-28 w-full rounded-lg object-cover" />
            ) : (
              <div className="grid h-28 place-items-center rounded-lg bg-white/5 text-xs text-stone-500">
                {t("control.games.noArt")}
              </div>
            )}
            <input
              type="file"
              accept={HUB_MEDIA_ACCEPT}
              disabled={busy}
              onChange={(e) => void upload(slot, e.target.files?.[0] ?? null)}
              className="block w-full text-xs text-stone-300"
            />
            {url && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void clear(slot)}
                className="text-[10px] font-bold uppercase text-red-300"
              >
                {t("control.games.clearArt")}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
