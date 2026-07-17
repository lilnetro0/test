import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Building2, Gamepad2, Search, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import {
  controlSearch,
  type ControlSearchGame,
  type ControlSearchHub,
  type ControlSearchUser,
} from "@/lib/control/api";
import { useT } from "@/lib/i18n";

type SearchParams = { q?: string };

export const Route = createFileRoute("/control/search")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  component: ControlSearchPage,
});

function ControlSearchPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const { q: qParam } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [draft, setDraft] = useState(qParam ?? "");
  const [users, setUsers] = useState<ControlSearchUser[]>([]);
  const [hubs, setHubs] = useState<ControlSearchHub[]>([]);
  const [games, setGames] = useState<ControlSearchGame[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDraft(qParam ?? "");
  }, [qParam]);

  useEffect(() => {
    if (!accessToken) return;
    const q = (qParam ?? "").trim();
    if (q.length < 1) {
      setUsers([]);
      setHubs([]);
      setGames([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void controlSearch({ data: { accessToken, q, limit: 20 } }).then((r) => {
      if (cancelled) return;
      setLoading(false);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setUsers(r.users);
      setHubs(r.hubs);
      setGames(r.games);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, qParam]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void navigate({ search: { q: draft.trim() || undefined } });
  };

  const empty =
    !loading &&
    (qParam ?? "").trim().length > 0 &&
    users.length === 0 &&
    hubs.length === 0 &&
    games.length === 0;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <Search className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.group.command")}
          </p>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{t("control.search.title")}</h1>
        <p className="text-sm text-stone-400">{t("control.search.subtitle")}</p>
      </header>

      <form onSubmit={submit} className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("control.search.inputPlaceholder")}
          className="min-w-0 flex-1 rounded-lg border border-border-subtle bg-white/5 px-3 py-2.5 text-sm text-white"
          autoFocus
        />
        <button
          type="submit"
          className="rounded-lg bg-accent/20 px-4 py-2.5 text-xs font-semibold text-accent"
        >
          {t("control.search.submit")}
        </button>
      </form>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading && <p className="text-sm text-stone-500">{t("control.search.searching")}</p>}
      {empty && <p className="text-sm text-stone-500">{t("control.search.noResults")}</p>}
      {!(qParam ?? "").trim() && !loading && (
        <p className="text-sm text-stone-500">{t("control.search.hint")}</p>
      )}

      {users.length > 0 && (
        <Section title={t("control.search.users")} icon={Users}>
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 border-b border-border-subtle/60 px-3 py-2.5 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">
                  {u.username}
                  <span className="text-stone-500">#{u.tag}</span>
                </p>
                <p className="truncate font-mono text-[10px] text-stone-500">{u.id}</p>
              </div>
              {u.banned_at && (
                <span className="text-[10px] font-semibold uppercase text-red-400">
                  {t("control.search.banned")}
                </span>
              )}
              <Link
                to="/control/users/$userId"
                params={{ userId: u.id }}
                className="text-xs font-semibold text-accent"
              >
                {t("control.search.openUser")}
              </Link>
            </div>
          ))}
        </Section>
      )}

      {hubs.length > 0 && (
        <Section title={t("control.search.hubs")} icon={Building2}>
          {hubs.map((h) => (
            <div
              key={h.id}
              className="flex items-center gap-3 border-b border-border-subtle/60 px-3 py-2.5 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">{h.name}</p>
                <p className="text-xs text-stone-500">
                  {h.slug}
                  {h.region ? ` · ${h.region}` : ""}
                  {` · ${h.member_count}`}
                </p>
              </div>
              <a href={`/c/${h.slug}`} className="text-xs font-semibold text-accent">
                {t("control.search.openHub")}
              </a>
              <Link
                to="/control/communities/$communityId"
                params={{ communityId: h.id }}
                className="text-xs font-semibold text-stone-400 hover:text-accent"
              >
                {t("control.search.opsSoon")}
              </Link>
            </div>
          ))}
        </Section>
      )}

      {games.length > 0 && (
        <Section title={t("control.search.games")} icon={Gamepad2}>
          {games.map((g) => (
            <div
              key={g.id}
              className="flex items-center gap-3 border-b border-border-subtle/60 px-3 py-2.5 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">{g.name}</p>
                <p className="text-xs text-stone-500">
                  {g.id} · {g.short} · {g.category}
                </p>
              </div>
              <Link
                to="/control/games/$gameId"
                params={{ gameId: g.id }}
                className="text-xs font-semibold text-accent"
              >
                {t("control.search.openGame")}
              </Link>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Users;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle">
      <h2 className="flex items-center gap-2 border-b border-border-subtle bg-white/[0.03] px-3 py-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
        <Icon className="size-3.5" />
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}
