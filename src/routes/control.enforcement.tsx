import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Gavel } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import { listEnforcementEvents, type AuditLogRow } from "@/lib/control/api";
import { useT } from "@/lib/i18n";

type Search = { userId?: string };

export const Route = createFileRoute("/control/enforcement")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    userId: typeof s.userId === "string" ? s.userId : undefined,
  }),
  component: EnforcementPage,
});

function EnforcementPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [draft, setDraft] = useState(search.userId ?? "");
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(search.userId ?? "");
  }, [search.userId]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    setLoading(true);
    void listEnforcementEvents({
      data: {
        accessToken,
        targetUserId: search.userId,
        limit: 50,
      },
    }).then((r) => {
      if (cancelled) return;
      setLoading(false);
      if (!r.ok) {
        setError(r.error);
        setRows([]);
        return;
      }
      setRows(r.rows);
      setError(null);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, search.userId]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void navigate({ search: { userId: draft.trim() || undefined } });
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-4 md:p-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <Gavel className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.group.work")}
          </p>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">
          {t("control.enforcement.title")}
        </h1>
        <p className="text-sm text-stone-400">{t("control.enforcement.subtitle")}</p>
      </header>

      <form onSubmit={submit} className="flex flex-wrap gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("control.enforcement.filterUser")}
          className="min-w-[16rem] flex-1 rounded-lg border border-border-subtle bg-white/5 px-3 py-2 text-sm text-white"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent/20 px-3 py-2 text-xs font-semibold text-accent"
        >
          {t("control.audit.apply")}
        </button>
        {search.userId && (
          <button
            type="button"
            onClick={() => void navigate({ search: {} })}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-stone-400"
          >
            {t("control.audit.reset")}
          </button>
        )}
      </form>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      {loading && <p className="text-sm text-stone-500">{t("control.checking")}</p>}
      {!loading && rows.length === 0 && (
        <p className="text-sm text-stone-500">{t("control.enforcement.empty")}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-border-subtle">
        <table className="w-full text-sm">
          <thead className="border-b border-border-subtle bg-white/[0.03] text-[10px] font-semibold uppercase tracking-wider text-stone-500">
            <tr>
              <th className="px-3 py-2 text-start">{t("control.audit.col.time")}</th>
              <th className="px-3 py-2 text-start">{t("control.audit.col.actor")}</th>
              <th className="px-3 py-2 text-start">{t("control.audit.col.action")}</th>
              <th className="px-3 py-2 text-start">{t("control.audit.col.target")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border-subtle/60 hover:bg-white/[0.03]">
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-stone-400">
                  <Link
                    to="/control/audit/$eventId"
                    params={{ eventId: row.id }}
                    className="hover:text-accent"
                  >
                    {new Date(row.created_at).toLocaleString()}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-xs">
                  {row.actor_username
                    ? `${row.actor_username}#${row.actor_tag}`
                    : row.actor_id.slice(0, 8)}
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-accent">{row.action}</td>
                <td className="px-3 py-2.5 text-xs text-stone-400">
                  {row.target_id ? (
                    row.target_type === "user" ? (
                      <Link
                        to="/control/users/$userId"
                        params={{ userId: row.target_id }}
                        className="text-accent hover:underline"
                      >
                        {row.target_id.slice(0, 8)}…
                      </Link>
                    ) : (
                      <span className="font-mono">
                        {row.target_type} · {row.target_id.slice(0, 8)}…
                      </span>
                    )
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
