import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Compass } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import { adminListGames, adminListHubs } from "@/lib/admin/api";
import {
  deleteControlDiscoveryPlacement,
  listControlDiscoveryPlacements,
  upsertControlDiscoveryPlacement,
  type ControlDiscoveryPlacement,
} from "@/lib/control/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/discovery")({
  component: DiscoveryPage,
});

function DiscoveryPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<ControlDiscoveryPlacement[]>([]);
  const [migrated, setMigrated] = useState(true);
  const [hubs, setHubs] = useState<Array<{ id: string; name: string }>>([]);
  const [games, setGames] = useState<Array<{ id: string; name: string }>>([]);
  const [kind, setKind] = useState<"hub" | "game">("hub");
  const [targetId, setTargetId] = useState("");
  const [region, setRegion] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!accessToken) return;
    const [p, h, g] = await Promise.all([
      listControlDiscoveryPlacements({ data: { accessToken } }),
      adminListHubs({ data: { accessToken } }),
      adminListGames({ data: { accessToken } }),
    ]);
    if (p.ok) {
      setMigrated(p.migrated);
      setRows(p.rows);
    } else toast.error(p.error);
    if (h.ok) {
      setHubs((h.hubs as Array<{ id: string; name: string }>).map((x) => ({ id: x.id, name: x.name })));
    }
    if (g.ok) {
      setGames((g.games as Array<{ id: string; name: string }>).map((x) => ({ id: x.id, name: x.name })));
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    const list = kind === "hub" ? hubs : games;
    if (list[0] && !list.some((x) => x.id === targetId)) setTargetId(list[0].id);
  }, [kind, hubs, games, targetId]);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken || !targetId) return;
    setBusy(true);
    const r = await upsertControlDiscoveryPlacement({
      data: { accessToken, kind, targetId, region, position: rows.length, active: true },
    });
    setBusy(false);
    if (!r.ok) toast.error(r.error);
    else {
      toast.success(t("control.discovery.saved"));
      void load();
    }
  };

  const remove = async (id: string) => {
    if (!accessToken) return;
    setBusy(true);
    const r = await deleteControlDiscoveryPlacement({ data: { accessToken, id } });
    setBusy(false);
    if (!r.ok) toast.error(r.error);
    else {
      toast.success(t("control.discovery.deleted"));
      void load();
    }
  };

  const options = kind === "hub" ? hubs : games;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <Compass className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.discovery")}
          </p>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{t("control.discovery.title")}</h1>
        <p className="text-sm text-stone-400">{t("control.discovery.subtitle")}</p>
      </header>

      {!migrated && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {t("control.discovery.needMigration")}
        </p>
      )}

      <form onSubmit={add} className="flex flex-wrap items-end gap-2 rounded-xl border border-border-subtle p-3">
        <label className="text-xs font-semibold text-stone-400">
          {t("control.discovery.kind")}
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as "hub" | "game")}
            className="mt-1 block rounded-lg border border-border-subtle bg-white/5 px-2 py-1.5 text-white"
          >
            <option value="hub">{t("control.nav.communities")}</option>
            <option value="game">{t("control.nav.catalog")}</option>
          </select>
        </label>
        <label className="min-w-[12rem] flex-1 text-xs font-semibold text-stone-400">
          {t("control.discovery.target")}
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-border-subtle bg-white/5 px-2 py-1.5 text-white"
          >
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-stone-400">
          {t("control.discovery.region")}
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="SA"
            className="mt-1 block w-24 rounded-lg border border-border-subtle bg-white/5 px-2 py-1.5 text-white"
          />
        </label>
        <button
          type="submit"
          disabled={!migrated || busy || !targetId}
          className="rounded-lg bg-accent/20 px-3 py-1.5 text-xs font-semibold text-accent disabled:opacity-40"
        >
          {t("control.discovery.add")}
        </button>
      </form>

      <ul className="overflow-hidden rounded-xl border border-border-subtle">
        {rows.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-stone-500">{t("control.discovery.empty")}</li>
        ) : (
          rows.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center gap-3 border-b border-border-subtle/60 px-3 py-2.5 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">{r.target_name ?? r.target_id}</p>
                <p className="text-xs text-stone-500">
                  {r.kind}
                  {r.region ? ` · ${r.region}` : ""}
                  {r.active ? "" : ` · ${t("control.discovery.inactive")}`}
                </p>
              </div>
              {r.kind === "hub" && (
                <Link
                  to="/control/communities/$communityId"
                  params={{ communityId: r.target_id }}
                  className="text-xs font-semibold text-accent"
                >
                  {t("control.search.openHub")}
                </Link>
              )}
              {r.kind === "game" && (
                <Link
                  to="/control/games/$gameId"
                  params={{ gameId: r.target_id }}
                  className="text-xs font-semibold text-accent"
                >
                  {t("control.search.openGame")}
                </Link>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => void remove(r.id)}
                className="text-xs font-semibold text-red-400"
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
