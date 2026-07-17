import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import { adminUpsertGame } from "@/lib/admin/api";
import { getControlGame, type ControlGameDetail } from "@/lib/control/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/games/$gameId/")({
  component: GameOverviewPage,
});

function GameOverviewPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const { gameId } = Route.useParams();
  const [game, setGame] = useState<ControlGameDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", short: "", category: "" });

  const load = async () => {
    if (!accessToken) return;
    const r = await getControlGame({ data: { accessToken, gameId } });
    if (r.ok) {
      setGame(r.game);
      setForm({ name: r.game.name, short: r.game.short, category: r.game.category });
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, gameId]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken || !game) return;
    setBusy(true);
    const r = await adminUpsertGame({
      data: {
        accessToken,
        game: {
          id: game.id,
          name: form.name,
          short: form.short,
          category: form.category,
          tint: game.tint,
          text_tint: game.text_tint,
          image_url: game.image_url,
          banner_url: game.banner_url,
          background_url: game.background_url,
          icon_url: game.icon_url,
        },
      },
    });
    setBusy(false);
    if (!r.ok) toast.error(r.error);
    else {
      toast.success(t("control.games.saved"));
      void load();
    }
  };

  if (!game) return <p className="text-sm text-stone-500">{t("control.checking")}</p>;

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => void save(e)} className="space-y-3 rounded-xl border border-border-subtle p-4">
        <label className="block space-y-1 text-xs text-stone-400">
          {t("control.games.field.name")}
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inputCls}
            dir="auto"
          />
        </label>
        <label className="block space-y-1 text-xs text-stone-400">
          {t("control.games.field.short")}
          <input
            value={form.short}
            onChange={(e) => setForm((f) => ({ ...f, short: e.target.value }))}
            className={inputCls}
          />
        </label>
        <label className="block space-y-1 text-xs text-stone-400">
          {t("control.games.field.category")}
          <input
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className={inputCls}
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
      <Link
        to="/control/communities/new"
        search={{ game_id: gameId }}
        className="inline-block text-xs font-semibold text-accent"
      >
        {t("control.games.createCommunity")}
      </Link>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-border-subtle bg-white/5 px-3 py-2 text-sm text-white";
