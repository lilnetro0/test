import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-provider";
import {
  listControlUserReports,
  listEnforcementEvents,
  type AuditLogRow,
  type ControlReportRow,
} from "@/lib/control/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/users/$userId/moderation")({
  component: UserModerationPage,
});

function UserModerationPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const { userId } = Route.useParams();
  const [reports, setReports] = useState<ControlReportRow[]>([]);
  const [events, setEvents] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void Promise.all([
      listControlUserReports({ data: { accessToken, userId } }),
      listEnforcementEvents({ data: { accessToken, targetUserId: userId, limit: 40 } }),
    ]).then(([rep, enf]) => {
      if (cancelled) return;
      setLoading(false);
      if (rep.ok) setReports(rep.reports);
      if (enf.ok) setEvents(enf.rows);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, userId]);

  if (loading) return <p className="text-sm text-stone-500">{t("control.checking")}</p>;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-border-subtle">
        <h2 className="border-b border-border-subtle bg-white/[0.03] px-3 py-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
          {t("control.user.reports")}
        </h2>
        {reports.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-stone-500">
            {t("control.user.noReports")}
          </p>
        ) : (
          <ul>
            {reports.map((r) => (
              <li key={r.id} className="border-b border-border-subtle/60 px-3 py-2.5 last:border-0">
                <Link
                  to="/control/moderation/$reportId"
                  params={{ reportId: r.id }}
                  className="font-semibold text-white hover:text-accent"
                >
                  {r.reason}{" "}
                  <span className="text-[10px] uppercase text-stone-500">{r.status}</span>
                </Link>
                <p className="text-xs text-stone-500">
                  {new Date(r.created_at).toLocaleString()}
                  {r.target_user_id === userId
                    ? ` · ${t("control.mod.target")}`
                    : ` · ${t("control.mod.reporter")}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-border-subtle">
        <h2 className="border-b border-border-subtle bg-white/[0.03] px-3 py-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
          {t("control.user.enforcement")}
        </h2>
        {events.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-stone-500">
            {t("control.user.noEnforcement")}
          </p>
        ) : (
          <ul>
            {events.map((e) => (
              <li key={e.id} className="border-b border-border-subtle/60 px-3 py-2.5 last:border-0">
                <p className="font-mono text-xs text-accent">{e.action}</p>
                <p className="text-xs text-stone-500">
                  {new Date(e.created_at).toLocaleString()}
                  {e.actor_username
                    ? ` · ${e.actor_username}#${e.actor_tag}`
                    : ` · ${e.actor_id.slice(0, 8)}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
