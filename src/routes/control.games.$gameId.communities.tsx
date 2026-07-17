import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import { adminListHubs } from "@/lib/admin/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/games/$gameId/communities")({
  component: GameCommunitiesPage,
});

function GameCommunitiesPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const { gameId } = Route.useParams();
  const [hubs, setHubs] = useState<Array<{ id: string; name: string; slug: string; region: string | null }>>(
    [],
  );

  useEffect(() => {
    if (!accessToken) return;
    void adminListHubs({ data: { accessToken } }).then((r) => {
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      const rows = (r.hubs as Array<{ id: string; name: string; slug: string; region: string | null; game_id: string }>).filter(
        (h) => h.game_id === gameId,
      );
      setHubs(rows);
    });
  }, [accessToken, gameId]);

  return (
    <div className="space-y-3">
      <Link
        to="/control/communities/new"
        search={{ game_id: gameId }}
        className="inline-block text-xs font-semibold text-accent"
      >
        {t("control.games.createCommunity")}
      </Link>
      <ul className="overflow-hidden rounded-xl border border-border-subtle">
        {hubs.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-stone-500">
            {t("control.games.noCommunities")}
          </li>
        ) : (
          hubs.map((h) => (
            <li key={h.id} className="border-b border-border-subtle/60 px-3 py-2.5 last:border-0">
              <Link
                to="/control/communities/$communityId"
                params={{ communityId: h.id }}
                className="font-semibold text-white hover:text-accent"
              >
                {h.name}
              </Link>
              <p className="text-xs text-stone-500">
                {h.slug}
                {h.region ? ` · ${h.region}` : ""}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
