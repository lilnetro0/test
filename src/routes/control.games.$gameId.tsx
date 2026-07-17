import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Gamepad2 } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import { getControlGame, type ControlGameDetail } from "@/lib/control/api";
import { useT, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/control/games/$gameId")({
  component: GameLayout,
});

const TABS: { suffix: string; to: string; labelKey: TKey }[] = [
  { suffix: "", to: "/control/games/$gameId", labelKey: "control.games.tab.overview" },
  {
    suffix: "/artwork",
    to: "/control/games/$gameId/artwork",
    labelKey: "control.games.tab.artwork",
  },
  {
    suffix: "/communities",
    to: "/control/games/$gameId/communities",
    labelKey: "control.games.tab.communities",
  },
];

function GameLayout() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const { gameId } = Route.useParams();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [game, setGame] = useState<ControlGameDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void getControlGame({ data: { accessToken, gameId } }).then((r) => {
      if (cancelled) return;
      if (!r.ok) {
        setError(r.error);
        setGame(null);
        return;
      }
      setGame(r.game);
      setError(null);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, gameId]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-8">
      <Link to="/control/games" className="text-xs font-semibold text-accent">
        ← {t("control.games.back")}
      </Link>
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      {game && (
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-accent">
            <Gamepad2 className="size-5" />
            <p className="text-[10px] font-semibold uppercase tracking-widest">
              {t("control.nav.catalog")}
            </p>
          </div>
          <h1 className="font-display text-2xl font-bold text-white">{game.name}</h1>
          <p className="text-xs text-stone-500">
            {game.id} · {game.short} · {game.category} · {game.community_count}{" "}
            {t("control.nav.communities")}
          </p>
          <nav className="flex flex-wrap gap-1 border-b border-border-subtle pb-px pt-2">
            {TABS.map((tab) => {
              const base = `/control/games/${gameId}`;
              const href = `${base}${tab.suffix}`;
              const active =
                tab.suffix === ""
                  ? pathname === base || pathname === `${base}/`
                  : pathname.startsWith(href);
              return (
                <Link
                  key={tab.suffix || "overview"}
                  to={tab.to}
                  params={{ gameId }}
                  className={cn(
                    "rounded-t-md px-3 py-2 text-xs font-semibold",
                    active
                      ? "border-b-2 border-accent text-accent"
                      : "text-stone-400 hover:text-white",
                  )}
                >
                  {t(tab.labelKey)}
                </Link>
              );
            })}
          </nav>
        </header>
      )}
      <Outlet />
    </div>
  );
}
