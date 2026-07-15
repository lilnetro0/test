import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { DISCOVER_HUBS, catalogGameId, type HubCard } from "@/lib/mock-data";
import { useEffect, useMemo, useState } from "react";
import { Search, Plus, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { HubHero } from "@/components/hub-hero";
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

  const filtered = useMemo(() => {
    return catalog.filter((h) => {
      const catMatch = cat === "All" || h.category === cat.toLowerCase().replace(" ", "-");
      const regionMatch = hubMatchesRegionFilter(h.region, regionFilter);
      const lfgMatch = !lfgOnly || Boolean(h.hasLfg);
      return catMatch && regionMatch && lfgMatch && hubMatchesQuery(h, query);
    });
  }, [catalog, cat, query, regionFilter, lfgOnly]);

  const trending = catalog.slice(0, 2);

  // Title with accent word: "Find your {squad} across every game."
  const title = t("discover.title");
  const accent = t("discover.titleAccent");
  const accentIdx = title.toLowerCase().indexOf(accent.toLowerCase());

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

  return (
    <AppShell>
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <section className="relative border-b border-border-subtle bg-gradient-to-br from-accent/10 via-background to-rose-500/10 px-6 py-12 md:px-12 md:py-16">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-accent">
            {t("discover.eyebrow")}
          </p>
          <h1 className="max-w-2xl font-display text-3xl font-bold uppercase leading-tight tracking-tight text-white md:text-5xl">
            {accentIdx >= 0 ? (
              <>
                {title.slice(0, accentIdx)}
                <span className="text-accent">{title.slice(accentIdx, accentIdx + accent.length)}</span>
                {title.slice(accentIdx + accent.length)}
              </>
            ) : (
              title
            )}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-stone-400">{t("discover.body")}</p>

          <div className="mt-6 flex max-w-xl items-center gap-2 rounded-xl border border-border-subtle bg-surface-mid px-4 py-3">
            <Search className="size-4 text-stone-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("discover.search")}
              dir="auto"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-stone-600"
            />
          </div>
        </section>

        <div className="px-6 py-6 md:px-12">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
              {t("discover.region.label")}
            </span>
            {regionChips.map((c) => (
              <button
                key={`r-${c.id || "all"}`}
                type="button"
                onClick={() => setRegionFilter(c.id)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  regionFilter === c.id
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border-subtle bg-surface-mid text-stone-400 hover:text-white"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                  cat === c.id
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border-subtle bg-surface-mid text-stone-400 hover:text-white"
                }`}
              >
                {t(c.key)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setLfgOnly((v) => !v)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                lfgOnly
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-border-subtle bg-surface-mid text-stone-400 hover:text-white"
              }`}
            >
              {t("discover.lfg")}
            </button>
          </div>

          {hubsLoading && live ? (
            <p className="mb-6 text-sm text-stone-500">{t("discover.loading")}</p>
          ) : null}

          {!hubsLoading && lfgOnly && filtered.length === 0 ? (
            <p className="mb-6 text-sm text-stone-400">{t("discover.lfg.empty")}</p>
          ) : null}

          {cat === "All" && trending.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-500">
                <TrendingUp className="size-3.5 text-accent" /> {t("discover.trending")}
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {trending.map((h) => (
                  <div
                    key={h.id}
                    className="relative overflow-hidden rounded-2xl border border-border-subtle"
                  >
                    <HubHero
                      gameId={catalogGameId(h)}
                      short={h.short}
                      imageUrl={h.imageUrl}
                      large
                      className="min-h-[140px]"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 pt-12">
                      <h3 className="font-display text-lg font-bold uppercase text-white" dir="auto">
                        {h.hubName}
                      </h3>
                      <p className="mt-1 text-xs text-stone-300">
                        {h.members.toLocaleString()} {t("discover.members")} · {h.activeCount}{" "}
                        {t("discover.active")}
                      </p>
                      <button
                        disabled={joining === h.id}
                        onClick={() => void joinHub(h.id, h.hubName)}
                        className="mt-3 rounded-md bg-accent px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-accent-foreground hover:brightness-110 disabled:opacity-50"
                      >
                        {t("discover.joinHub")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-stone-500">
            {cat === "All"
              ? t("discover.allHubs")
              : t(CATEGORIES.find((c) => c.id === cat)?.key ?? "discover.allHubs")}{" "}
            — {filtered.length}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((h) => (
              <div
                key={h.id}
                className="group overflow-hidden rounded-xl border border-border-subtle bg-surface-mid transition-colors hover:border-accent/30"
              >
                <HubHero gameId={catalogGameId(h)} short={h.short} imageUrl={h.imageUrl} className="h-24" />
                <div className="p-4">
                  <h3 className="truncate font-semibold text-white" dir="auto">
                    {h.hubName}
                  </h3>
                  <p className="mt-1 truncate text-xs text-stone-500" dir="auto">
                    {h.name}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-stone-600">
                    {h.region
                      ? regionLabel(normalizeRegionCode(h.region), lang)
                      : t("discover.region.globalBadge")}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-stone-400">
                    <span>
                      {h.members.toLocaleString()} {t("discover.members")}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-online" />
                      {h.activeCount}
                    </span>
                  </div>
                  <button
                    disabled={joining === h.id}
                    onClick={() => void joinHub(h.id, h.hubName)}
                    className="mt-3 w-full rounded-md bg-white/5 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent/15 hover:text-accent disabled:opacity-50"
                  >
                    {t("discover.join")}
                  </button>
                </div>
              </div>
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
              className="grid min-h-[220px] place-items-center rounded-xl border border-dashed border-border-subtle text-stone-500 opacity-80 transition-colors hover:border-accent/40 hover:text-accent"
            >
              <div className="text-center">
                <div className="mx-auto grid size-12 place-items-center rounded-full border border-current">
                  <Plus className="size-5" />
                </div>
                <p className="mt-2 text-xs font-semibold uppercase tracking-widest">
                  {t("discover.startOwn")}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-stone-600">
                  {isAdmin ? t("discover.startOwnAdmin") : t("discover.startOwnDenied")}
                </p>
              </div>
            </button>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
