import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Building2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import { adminDeleteHub, adminListHubs } from "@/lib/admin/api";
import { useT } from "@/lib/i18n";

type HubRow = {
  id: string;
  game_id: string;
  slug: string;
  name: string;
  member_count: number;
  region: string | null;
  image_url: string | null;
  game?: { name: string; short: string } | { name: string; short: string }[] | null;
};

export const Route = createFileRoute("/control/communities/")({
  component: CommunitiesListPage,
});

function CommunitiesListPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const [hubs, setHubs] = useState<HubRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    const r = await adminListHubs({ data: { accessToken } });
    setLoading(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    setHubs(r.hubs as HubRow[]);
  }, [accessToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const remove = async (id: string, name: string) => {
    if (!accessToken) return;
    if (!window.confirm(t("control.comm.deleteConfirm", { name }))) return;
    const r = await adminDeleteHub({ data: { accessToken, hubId: id } });
    if (!r.ok) toast.error(r.error);
    else {
      toast.success(t("control.comm.deleted"));
      void refresh();
    }
  };

  const gameLabel = (h: HubRow) => {
    const g = Array.isArray(h.game) ? h.game[0] : h.game;
    return g?.name ?? h.game_id;
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-4 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-accent">
            <Building2 className="size-5" />
            <p className="text-[10px] font-semibold uppercase tracking-widest">
              {t("control.nav.group.work")}
            </p>
          </div>
          <h1 className="font-display text-2xl font-bold text-white">{t("control.comm.title")}</h1>
          <p className="text-sm text-stone-400">{t("control.comm.subtitle")}</p>
        </div>
        <Link
          to="/control/communities/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent/20 px-3 py-2 text-xs font-semibold text-accent"
        >
          <Plus className="size-3.5" />
          {t("control.comm.create")}
        </Link>
      </header>

      {loading && <p className="text-sm text-stone-500">{t("control.checking")}</p>}
      {!loading && hubs.length === 0 && (
        <p className="rounded-xl border border-dashed border-border-subtle p-8 text-center text-sm text-stone-500">
          {t("control.comm.empty")}
        </p>
      )}

      <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle">
        {hubs.map((h) => (
          <li
            key={h.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-white/[0.03]"
          >
            <div className="min-w-0">
              <Link
                to="/control/communities/$communityId"
                params={{ communityId: h.id }}
                className="font-semibold text-white hover:text-accent"
              >
                {h.name}
              </Link>
              <p className="text-xs text-stone-500">
                {h.slug} · {gameLabel(h)}
                {h.region ? ` · ${h.region}` : ""} · {h.member_count}{" "}
                {t("control.comm.members")}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/control/communities/$communityId/channels"
                params={{ communityId: h.id }}
                className="rounded-md bg-white/5 px-2 py-1 text-[10px] font-bold uppercase text-stone-300"
              >
                {t("control.comm.channels")}
              </Link>
              <button
                type="button"
                onClick={() => void remove(h.id, h.name)}
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
