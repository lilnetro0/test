import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MyCommunitiesList } from "@/components/community/my-communities-list";
import { ListSkeleton } from "@/components/ui-native";
import { useAuth } from "@/lib/auth-provider";
import { fetchUserHubs, fetchLiveHubs } from "@/lib/chat/api";
import { GAMES, type HubCard } from "@/lib/mock-data";
import { shouldUseMockData } from "@/lib/supabase/env";
import { getHubOrder, getLastHub, setHubOrder } from "@/lib/prefs";
import { useT, translateStatic } from "@/lib/i18n";

export type HomeSearch = {
  hub?: string;
  hubs?: "1";
};

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    const next: HomeSearch = {};
    if (typeof search.hub === "string" && search.hub.trim()) {
      next.hub = search.hub.trim();
    }
    if (search.hubs === "1" || search.hubs === 1 || search.hubs === true) {
      next.hubs = "1";
    }
    return next;
  },
  head: () => ({
    meta: [
      { title: translateStatic("meta.page.myCommunities") },
      {
        name: "description",
        content: "Your game communities on Nexus — pick a place, then open chat or voice.",
      },
    ],
  }),
  component: MyCommunitiesPage,
});

function MyCommunitiesPage() {
  const { hub: hubFromSearch } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { t } = useT();
  const { user, configured, prefs, savePrefs } = useAuth();
  const live = !shouldUseMockData();
  const [hubs, setHubs] = useState<HubCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [hubOrder, setHubOrderState] = useState<string[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [lastHub, setLastHubState] = useState<string | null>(null);

  // Legacy deep links → Game Home
  useEffect(() => {
    if (hubFromSearch) {
      void navigate({
        to: "/c/$hubSlug",
        params: { hubSlug: hubFromSearch },
        replace: true,
      });
    }
  }, [hubFromSearch, navigate]);

  useEffect(() => {
    setLastHubState(getLastHub());
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      if (!live) {
        if (cancelled) return;
        setHubs(GAMES);
        setHubOrderState(getHubOrder(GAMES.map((g) => g.id)));
        setLoading(false);
        return;
      }
      if (!user?.id) {
        if (cancelled) return;
        setHubs([]);
        setLoading(false);
        return;
      }
      const mine = await fetchUserHubs(user.id);
      let list = mine.hubs;
      if (!list.length) {
        const all = await fetchLiveHubs();
        list = all.hubs.map((h) => h.game);
      }
      if (cancelled) return;
      setHubs(list);
      const fallback = list.map((h) => h.id);
      if (configured && prefs?.hub_order && Array.isArray(prefs.hub_order) && prefs.hub_order.length) {
        setHubOrderState(getHubOrder(prefs.hub_order as string[]));
      } else {
        setHubOrderState(getHubOrder(fallback.length ? fallback : GAMES.map((g) => g.id)));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [live, user?.id, configured, prefs]);

  const ordered = useMemo(() => {
    const byId = new Map(hubs.map((h) => [h.id, h]));
    const next = hubOrder.map((id) => byId.get(id)).filter(Boolean) as HubCard[];
    const seen = new Set(next.map((h) => h.id));
    for (const h of hubs) {
      if (!seen.has(h.id)) next.push(h);
    }
    return next;
  }, [hubs, hubOrder]);

  const onReorder = useCallback(
    (targetId: string) => {
      if (!dragId || dragId === targetId) {
        setDragId(null);
        return;
      }
      setHubOrderState((prev) => {
        const next = [...prev];
        const from = next.indexOf(dragId);
        const to = next.indexOf(targetId);
        if (from < 0 || to < 0) return prev;
        next.splice(from, 1);
        next.splice(to, 0, dragId);
        setHubOrder(next);
        if (configured) void savePrefs({ hub_order: next });
        return next;
      });
      setDragId(null);
    },
    [dragId, configured, savePrefs],
  );

  return (
    <AppShell>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-border-subtle/80 px-4 py-4">
          <p className="nx-caption text-accent">{t("community.my.eyebrow")}</p>
          <h1 className="nx-display mt-1 text-2xl text-white">{t("community.my.title")}</h1>
          <p className="mt-1 text-sm text-stone-400">{t("community.my.subtitle")}</p>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4">
              <ListSkeleton rows={4} />
            </div>
          ) : (
            <MyCommunitiesList
              hubs={ordered}
              lastHub={lastHub}
              onReorder={onReorder}
              dragId={dragId}
              setDragId={setDragId}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
