import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { DISCOVER_HUBS, FRIENDS, catalogGameId, type HubCard } from "@/lib/mock-data";
import { useEffect, useMemo, useState } from "react";
import { Search, Plus, SlidersHorizontal, ChevronLeft, Users } from "lucide-react";
import { toast } from "sonner";
import { HubHero } from "@/components/hub-hero";
import { GameIcon } from "@/components/game-icon";
import { resolveBannerUrl, resolveCoverUrl, resolveIconUrl } from "@/lib/game-artwork";
import { useT, type TKey, translateStatic } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-provider";
import { shouldUseMockData } from "@/lib/supabase/env";
import { fetchLiveHubs, joinHubBySlug } from "@/lib/chat/api";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { hubMatchesQuery } from "@/lib/hub-search";
import {
  hubMatchesRegionFilter,
  normalizeRegionCode,
  readStoredRegion,
  REGION_OPTIONS,
  regionLabel,
  type RegionCode,
} from "@/lib/regions";
import {
  ScreenHeader,
  Section,
  ListRow,
  FilterSheet,
  ListSkeleton,
} from "@/components/ui-native";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: translateStatic("meta.page.discover") },
      { name: "description", content: translateStatic("meta.page.discoverDesc") },
    ],
  }),
  component: DiscoverPage,
});

const CATEGORIES: { id: string; key: TKey }[] = [
  { id: "All", key: "discover.cat.all" },
  { id: "Shooter", key: "discover.cat.shooter" },
  { id: "MOBA", key: "discover.cat.moba" },
  { id: "Battle Royale", key: "discover.cat.br" },
  { id: "Sandbox", key: "discover.cat.sandbox" },
  { id: "Sports", key: "discover.cat.sports" },
];

function DiscoverPage() {
  const [cat, setCat] = useState("All");
  const [regionFilter, setRegionFilter] = useState<RegionCode | "">("");
  const [lfgOnly, setLfgOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [focusedGameId, setFocusedGameId] = useState<string | null>(null);
  const [joining, setJoining] = useState<string | null>(null);
  const [liveHubs, setLiveHubs] = useState<HubCard[]>([]);
  const [hubsLoading, setHubsLoading] = useState(false);
  const { t, lang } = useT();
  const { user, prefs } = useAuth();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const live = !shouldUseMockData();

  const myRegion = normalizeRegionCode(prefs?.region ?? readStoredRegion());

  useEffect(() => {
    if (!live) return;
    let cancelled = false;
    setHubsLoading(true);
    void fetchLiveHubs().then(({ hubs, error }) => {
      if (cancelled) return;
      if (error) toast.error(error);
      setLiveHubs(hubs.map((h) => h.game));
      setHubsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [live]);

  const catalog = live ? liveHubs : DISCOVER_HUBS;

  const games = useMemo(() => {
    const seen = new Map<string, HubCard>();
    for (const h of catalog) {
      const gid = catalogGameId(h);
      if (!seen.has(gid)) seen.set(gid, h);
    }
    return [...seen.values()];
  }, [catalog]);

  const filtered = useMemo(() => {
    return catalog.filter((h) => {
      const catMatch = cat === "All" || h.category === cat.toLowerCase().replace(" ", "-");
      const regionMatch = hubMatchesRegionFilter(h.region, regionFilter);
      const lfgMatch = !lfgOnly || Boolean(h.hasLfg);
      const gameMatch = !focusedGameId || catalogGameId(h) === focusedGameId;
      return catMatch && regionMatch && lfgMatch && gameMatch && hubMatchesQuery(h, query);
    });
  }, [catalog, cat, query, regionFilter, lfgOnly, focusedGameId]);

  const focusedGame = focusedGameId
    ? games.find((g) => catalogGameId(g) === focusedGameId) ?? null
    : null;

  const filterCount =
    (cat !== "All" ? 1 : 0) + (regionFilter ? 1 : 0) + (lfgOnly ? 1 : 0);

  const joinHub = async (slug: string, hubName: string) => {
    if (!live) {
      toast.success(t("toast.joinedHub", { name: hubName }));
      void navigate({ to: "/", search: { hub: slug, hubs: undefined } });
      return;
    }
    if (!user) {
      toast.error(t("toast.joinHubSignIn"));
      return;
    }
    setJoining(slug);
    try {
      const result = await joinHubBySlug(slug, user.id);
      if (!result.ok) {
        toast.error(result.error ?? t("toast.joinHubFail"));
        return;
      }
      toast.success(t("toast.joinedHub", { name: hubName }));
      void navigate({ to: "/", search: { hub: slug, hubs: undefined } });
    } finally {
      setJoining(null);
    }
  };

  const regionChips: { id: RegionCode | ""; label: string }[] = [
    { id: "", label: t("discover.region.all") },
    { id: "MENA", label: t("discover.region.mena") },
    ...(myRegion && myRegion !== "MENA"
      ? [{ id: myRegion as RegionCode, label: t("discover.region.mine") }]
      : []),
    ...REGION_OPTIONS.filter((o) => o.code === "SA" || o.code === "AE" || o.code === "EG").map(
      (o) => ({ id: o.code as RegionCode, label: regionLabel(o.code, lang) }),
    ),
  ];

  const people = FRIENDS.filter((f) => f.status === "online" || f.status === "idle").slice(0, 6);

  if (focusedGame) {
    return (
      <AppShell>
        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="px-4 pt-3 md:px-6">
            <button
              type="button"
              onClick={() => setFocusedGameId(null)}
              className="nx-touch inline-flex items-center gap-1 text-sm font-semibold text-stone-400 hover:text-white"
            >
              <ChevronLeft className="size-4 rtl:rotate-180" />
              {t("discover.heading")}
            </button>
          </div>
          <HubHero
            gameId={catalogGameId(focusedGame)}
            short={focusedGame.short}
            imageUrl={resolveBannerUrl({
              coverUrl: focusedGame.imageUrl,
              bannerUrl: focusedGame.bannerUrl,
            })}
            large
            className="mt-2 min-h-[160px] w-full rounded-none"
          />
          <div className="space-y-6 px-4 py-5 md:px-6">
            <div>
              <h1 className="nx-title" dir="auto">
                {focusedGame.name}
              </h1>
              <p className="nx-body mt-1">{t("discover.gameSupport")}</p>
            </div>
            <Section title={t("discover.hubsForGame")}>
              {filtered.length === 0 ? (
                <p className="nx-body px-1 py-4">{t("discover.lfg.empty")}</p>
              ) : (
                filtered.map((h) => (
                  <CommunityRow
                    key={h.id}
                    hub={h}
                    joining={joining}
                    onOpen={() => void joinHub(h.id, h.hubName)}
                    t={t}
                    lang={lang}
                  />
                ))
              )}
            </Section>
            <Button type="button" variant="ghost" size="touch" className="w-full" onClick={() => setFocusedGameId(null)}>
              {t("discover.seeAll")}
            </Button>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <ScreenHeader title={t("discover.heading")} subtitle={t("discover.support")} />

        <div className="space-y-6 px-4 py-4 md:px-6">
          <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-white/[0.03] px-3 py-2.5">
            <Search className="size-4 shrink-0 text-stone-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("discover.search")}
              dir="auto"
              className="min-h-11 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-stone-600"
            />
          </div>

          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="nx-touch inline-flex items-center gap-2 rounded-lg border border-border-subtle px-3 text-sm font-semibold text-stone-300 hover:border-accent/40 hover:text-white"
          >
            <SlidersHorizontal className="size-4" />
            {t("discover.filters")}
            {filterCount > 0 ? (
              <span className="rounded-full bg-accent/20 px-1.5 text-[10px] font-bold text-accent">
                {filterCount}
              </span>
            ) : null}
          </button>

          {hubsLoading && live ? <ListSkeleton rows={4} /> : null}

          {!hubsLoading && lfgOnly && filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t("empty.lfg.title")}
              body={t("discover.lfg.empty")}
              primaryAction={
                <Button type="button" variant="accent" size="touch" onClick={() => setLfgOnly(false)}>
                  {t("discover.filtersClear")}
                </Button>
              }
            />
          ) : null}

          <Section title={t("discover.section.games")}>
            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
              {games.map((g) => {
                const gid = catalogGameId(g);
                return (
                  <button
                    key={gid}
                    type="button"
                    onClick={() => setFocusedGameId(gid)}
                    className="nx-press w-28 shrink-0 overflow-hidden rounded-2xl border border-border-subtle/70 text-start shadow-[var(--nx-shadow-1)] transition-[border-color,box-shadow] hover:border-accent/35 hover:shadow-[var(--nx-shadow-2)]"
                  >
                    <HubHero
                      gameId={gid}
                      short={g.short}
                      imageUrl={resolveCoverUrl({
                        coverUrl: g.imageUrl,
                        bannerUrl: g.bannerUrl,
                      })}
                      className="h-[4.5rem] rounded-none"
                    />
                    <span className="nx-label block truncate px-2.5 py-2.5 text-[0.75rem]" dir="auto">
                      {g.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title={t("discover.section.communities")}>
            {filtered.map((h) => (
              <CommunityRow
                key={h.id}
                hub={h}
                joining={joining}
                onOpen={() => void joinHub(h.id, h.hubName)}
                t={t}
                lang={lang}
              />
            ))}
            <button
              type="button"
              onClick={() => {
                if (isAdmin) {
                  void navigate({ to: "/admin" });
                  return;
                }
                toast(t("discover.startOwnDenied"));
              }}
              className="flex min-h-11 w-full items-center gap-3 px-4 py-3 text-start text-stone-500 hover:bg-white/[0.03] hover:text-accent"
            >
              <Plus className="size-5" />
              <span className="nx-label">{t("discover.startOwn")}</span>
            </button>
          </Section>

          <Section title={t("discover.section.people")}>
            {people.map((p) => (
              <ListRow
                key={`${p.name}${p.tag}`}
                title={p.name}
                subtitle={p.activity ?? p.tag}
                leading={
                  <div className="grid size-10 place-items-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                    {p.name.slice(0, 1)}
                  </div>
                }
                trailing={
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/profile/$username" params={{ username: p.name }}>
                      {t("discover.view")}
                    </Link>
                  </Button>
                }
              />
            ))}
          </Section>
        </div>
      </main>

      <FilterSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        title={t("discover.filters")}
        footer={
          <Button type="button" variant="accent" size="touch" className="w-full" onClick={() => setFiltersOpen(false)}>
            {t("discover.filtersDone")}
          </Button>
        }
      >
        <div className="space-y-5">
          <div>
            <p className="nx-section mb-2">{t("discover.region.label")}</p>
            <div className="flex flex-wrap gap-2">
              {regionChips.map((c) => (
                <button
                  key={`r-${c.id || "all"}`}
                  type="button"
                  onClick={() => setRegionFilter(c.id)}
                  className={`min-h-11 rounded-lg border px-3 text-xs font-semibold ${
                    regionFilter === c.id
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border-subtle text-stone-400"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="nx-section mb-2">{t("discover.genre")}</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCat(c.id)}
                  className={`min-h-11 rounded-lg border px-3 text-xs font-semibold ${
                    cat === c.id
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border-subtle text-stone-400"
                  }`}
                >
                  {t(c.key)}
                </button>
              ))}
            </div>
          </div>
          <label className="flex min-h-11 items-center gap-3 text-sm text-stone-300">
            <input
              type="checkbox"
              checked={lfgOnly}
              onChange={(e) => setLfgOnly(e.target.checked)}
              className="size-4 accent-[color:var(--accent)]"
            />
            {t("discover.lfg")}
          </label>
        </div>
      </FilterSheet>
    </AppShell>
  );
}

function CommunityRow({
  hub,
  joining,
  onOpen,
  t,
  lang,
}: {
  hub: HubCard;
  joining: string | null;
  onOpen: () => void;
  t: (key: TKey, vars?: Record<string, string>) => string;
  lang: "en" | "ar";
}) {
  return (
    <ListRow
      title={hub.hubName}
      subtitle={`${hub.members.toLocaleString()} ${t("discover.members")} · ${
        hub.region
          ? regionLabel(normalizeRegionCode(hub.region), lang)
          : t("discover.region.globalBadge")
      }`}
      leading={
        <GameIcon
          src={resolveIconUrl({
            coverUrl: hub.imageUrl,
            iconUrl: hub.iconUrl,
          })}
          short={hub.short}
          tint={hub.tint}
          textTint={hub.textTint}
          size="md"
        />
      }
      trailing={
        <Button type="button" variant="accent" size="sm" disabled={joining === hub.id} onClick={onOpen}>
          {t("discover.open")}
        </Button>
      }
    />
  );
}
