import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import { listAuditLogs, type AuditLogRow } from "@/lib/control/api";
import { useT } from "@/lib/i18n";

type AuditSearch = {
  action?: string;
  targetType?: string;
  targetId?: string;
  actorId?: string;
};

export const Route = createFileRoute("/control/audit/")({
  validateSearch: (s: Record<string, unknown>): AuditSearch => ({
    action: typeof s.action === "string" ? s.action : undefined,
    targetType: typeof s.targetType === "string" ? s.targetType : undefined,
    targetId: typeof s.targetId === "string" ? s.targetId : undefined,
    actorId: typeof s.actorId === "string" ? s.actorId : undefined,
  }),
  component: ControlAuditPage,
});

function ControlAuditPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionDraft, setActionDraft] = useState(search.action ?? "");

  useEffect(() => {
    setActionDraft(search.action ?? "");
  }, [search.action]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void listAuditLogs({
      data: {
        accessToken,
        limit: 50,
        action: search.action,
        targetType: search.targetType,
        targetId: search.targetId,
        actorId: search.actorId,
      },
    }).then((r) => {
      if (cancelled) return;
      setLoading(false);
      if (!r.ok) {
        setError(r.error);
        setRows([]);
        setNextCursor(null);
        return;
      }
      setRows(r.rows);
      setNextCursor(r.nextCursor);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, search.action, search.targetType, search.targetId, search.actorId]);

  const loadMore = () => {
    if (!accessToken || !nextCursor) return;
    void listAuditLogs({
      data: {
        accessToken,
        limit: 50,
        cursor: nextCursor,
        action: search.action,
        targetType: search.targetType,
        targetId: search.targetId,
        actorId: search.actorId,
      },
    }).then((r) => {
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setRows((prev) => [...prev, ...r.rows]);
      setNextCursor(r.nextCursor);
    });
  };

  const applyFilters = () => {
    void navigate({
      search: {
        action: actionDraft.trim() || undefined,
        targetType: search.targetType,
        targetId: search.targetId,
        actorId: search.actorId,
      },
    });
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-4 md:p-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <ScrollText className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.group.platform")}
          </p>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{t("control.audit.title")}</h1>
        <p className="text-sm text-stone-400">{t("control.audit.subtitle")}</p>
      </header>

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters();
        }}
      >
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs text-stone-400">
          {t("control.audit.filterAction")}
          <input
            value={actionDraft}
            onChange={(e) => setActionDraft(e.target.value)}
            placeholder="user.ban"
            className="rounded-lg border border-border-subtle bg-white/5 px-3 py-2 text-sm text-white"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-accent/20 px-3 py-2 text-xs font-semibold text-accent"
        >
          {t("control.audit.apply")}
        </button>
        {(search.action || search.targetType || search.targetId || search.actorId) && (
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-xs font-semibold text-stone-400 hover:text-white"
            onClick={() => void navigate({ search: {} })}
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

      <div className="overflow-hidden rounded-xl border border-border-subtle">
        <table className="w-full text-start text-sm">
          <thead className="border-b border-border-subtle bg-white/[0.03] text-[10px] font-semibold uppercase tracking-wider text-stone-500">
            <tr>
              <th className="px-3 py-2 text-start">{t("control.audit.col.time")}</th>
              <th className="px-3 py-2 text-start">{t("control.audit.col.actor")}</th>
              <th className="px-3 py-2 text-start">{t("control.audit.col.action")}</th>
              <th className="px-3 py-2 text-start">{t("control.audit.col.target")}</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-stone-500">
                  {t("control.checking")}
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-stone-500">
                  {t("control.audit.empty")}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border-subtle/60 hover:bg-white/[0.03]">
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-stone-400">
                  <Link
                    to="/control/audit/$eventId"
                    params={{ eventId: row.id }}
                    className="text-stone-300 hover:text-accent"
                  >
                    {new Date(row.created_at).toLocaleString()}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-xs">
                  {row.actor_username ? (
                    <span>
                      {row.actor_username}
                      <span className="text-stone-500">#{row.actor_tag}</span>
                    </span>
                  ) : (
                    <span className="font-mono text-stone-500">{row.actor_id.slice(0, 8)}</span>
                  )}
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-accent">{row.action}</td>
                <td className="px-3 py-2.5 text-xs text-stone-400">
                  {row.target_type ? (
                    <span>
                      {row.target_type}
                      {row.target_id ? (
                        <span className="ms-1 font-mono text-stone-500">
                          {row.target_id.slice(0, 8)}…
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {nextCursor && (
        <button
          type="button"
          onClick={loadMore}
          className="rounded-lg border border-border-subtle px-3 py-2 text-xs font-semibold text-stone-300 hover:bg-white/5"
        >
          {t("control.audit.loadMore")}
        </button>
      )}
    </div>
  );
}
