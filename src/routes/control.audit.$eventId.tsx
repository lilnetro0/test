import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import { getAuditEvent, type AuditLogRow } from "@/lib/control/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/audit/$eventId")({
  component: ControlAuditDetailPage,
});

function ControlAuditDetailPage() {
  const { t } = useT();
  const { eventId } = Route.useParams();
  const { accessToken } = useAuth();
  const [row, setRow] = useState<AuditLogRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    setLoading(true);
    void getAuditEvent({ data: { accessToken, eventId } }).then((r) => {
      if (cancelled) return;
      setLoading(false);
      if (!r.ok) {
        setError(r.error);
        setRow(null);
        return;
      }
      setRow(r.row);
      setError(null);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, eventId]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4 md:p-8">
      <Link to="/control/audit" className="text-xs font-semibold text-accent">
        ← {t("control.audit.back")}
      </Link>

      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <ScrollText className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.audit.detailEyebrow")}
          </p>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">
          {loading ? "…" : (row?.action ?? t("control.audit.notFound"))}
        </h1>
      </header>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {row && (
        <dl className="space-y-3 rounded-xl border border-border-subtle p-4 text-sm">
          <Row
            label={t("control.audit.col.time")}
            value={new Date(row.created_at).toLocaleString()}
          />
          <Row
            label={t("control.audit.col.actor")}
            value={row.actor_username ? `${row.actor_username}#${row.actor_tag}` : row.actor_id}
          />
          <Row label={t("control.audit.col.action")} value={row.action} mono />
          <Row
            label={t("control.audit.col.target")}
            value={
              row.target_type
                ? `${row.target_type}${row.target_id ? ` · ${row.target_id}` : ""}`
                : "—"
            }
          />
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
              {t("control.audit.meta")}
            </dt>
            <dd className="mt-1 overflow-x-auto rounded-lg bg-black/30 p-3 font-mono text-xs text-stone-300">
              <pre>{JSON.stringify(row.meta ?? {}, null, 2)}</pre>
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">{label}</dt>
      <dd className={mono ? "mt-0.5 font-mono text-accent" : "mt-0.5 text-white"}>{value}</dd>
    </div>
  );
}
