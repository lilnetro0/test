import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Gamepad2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import { adminDeleteGame, adminListGames } from "@/lib/admin/api";
import { useT } from "@/lib/i18n";

type GameRow = {
  id: string;
  name: string;
  short: string;
  category: string;
  image_url: string | null;
};

export const Route = createFileRoute("/control/games/")({
  component: GamesListPage,
});

function GamesListPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const [games, setGames] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    const r = await adminListGames({ data: { accessToken } });
    setLoading(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    setGames(r.games as GameRow[]);
  }, [accessToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const remove = async (id: string, name: string) => {
    if (!accessToken) return;
    if (!window.confirm(t("control.games.deleteConfirm", { name }))) return;
    const r = await adminDeleteGame({ data: { accessToken, gameId: id } });
    if (!r.ok) toast.error(r.error);
    else {
      toast.success(t("control.games.deleted"));
      void refresh();
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-4 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-accent">
            <Gamepad2 className="size-5" />
            <p className="text-[10px] font-semibold uppercase tracking-widest">
              {t("control.nav.group.work")}
            </p>
          </div>
          <h1 className="font-display text-2xl font-bold text-white">{t("control.games.title")}</h1>
          <p className="text-sm text-stone-400">{t("control.games.subtitle")}</p>
        </div>
        <Link
          to="/control/games/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent/20 px-3 py-2 text-xs font-semibold text-accent"
        >
          <Plus className="size-3.5" />
          {t("control.games.create")}
        </Link>
      </header>

      {loading && <p className="text-sm text-stone-500">{t("control.checking")}</p>}
      {!loading && games.length === 0 && (
        <p className="rounded-xl border border-dashed border-border-subtle p-8 text-center text-sm text-stone-500">
          {t("control.games.empty")}
        </p>
      )}

      <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle">
        {games.map((g) => (
          <li
            key={g.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-white/[0.03]"
          >
            <div className="flex min-w-0 items-center gap-3">
              {g.image_url ? (
                <img src={g.image_url} alt="" className="size-10 rounded-lg object-cover" />
              ) : (
                <div className="grid size-10 place-items-center rounded-lg bg-white/5 text-xs text-stone-500">
                  {g.short}
                </div>
              )}
              <div>
                <Link
                  to="/control/games/$gameId"
                  params={{ gameId: g.id }}
                  className="font-semibold text-white hover:text-accent"
                >
                  {g.name}
                </Link>
                <p className="text-xs text-stone-500">
                  {g.id} · {g.category}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                to="/control/games/$gameId/artwork"
                params={{ gameId: g.id }}
                className="rounded-md bg-white/5 px-2 py-1 text-[10px] font-bold uppercase text-stone-300"
              >
                {t("control.games.artwork")}
              </Link>
              <button
                type="button"
                onClick={() => void remove(g.id, g.name)}
                className="rounded-md bg-red-500/10 px-2 py-1 text-[10px] font-bold uppercase text-red-300"
              >
                {t("control.comm.delete")}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
