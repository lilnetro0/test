import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-provider";
import { getControlAnalyticsOverview, type ControlAnalyticsOverview } from "@/lib/control/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/analytics/engagement")({
  component: AnalyticsEngagementPage,
});

function AnalyticsEngagementPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const [d7, setD7] = useState<ControlAnalyticsOverview | null>(null);
  const [d30, setD30] = useState<ControlAnalyticsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void Promise.all([
      getControlAnalyticsOverview({ data: { accessToken, rangeDays: 7 } }),
      getControlAnalyticsOverview({ data: { accessToken, rangeDays: 30 } }),
    ]).then(([a, b]) => {
      if (cancelled) return;
      if (!a.ok) {
        setError(a.error);
        return;
      }
      if (!b.ok) {
        setError(b.error);
        return;
      }
      setError(null);
      setD7(a.overview);
      setD30(b.overview);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-400">{t("control.analytics.engagementBody")}</p>
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      <div className="overflow-hidden rounded-xl border border-border-subtle">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-[10px] uppercase tracking-widest text-stone-500">
            <tr>
              <th className="px-3 py-2 text-start font-semibold">{t("control.analytics.metric")}</th>
              <th className="px-3 py-2 text-end font-semibold">7d</th>
              <th className="px-3 py-2 text-end font-semibold">30d</th>
            </tr>
          </thead>
          <tbody>
            <Row label={t("control.analytics.kpi.active")} a={d7?.activeApprox} b={d30?.activeApprox} />
            <Row label={t("control.analytics.kpi.newUsers")} a={d7?.newUsers} b={d30?.newUsers} />
            <Row label={t("control.analytics.kpi.newHubs")} a={d7?.newHubs} b={d30?.newHubs} />
            <Row label={t("control.analytics.kpi.messages")} a={d7?.newMessages} b={d30?.newMessages} />
            <Row label={t("control.analytics.kpi.reports")} a={d7?.newReports} b={d30?.newReports} />
          </tbody>
        </table>
      </div>
      <Link to="/control/community-health" className="text-xs font-semibold text-accent">
        {t("control.nav.communityHealth")} →
      </Link>
    </div>
  );
}

function Row({ label, a, b }: { label: string; a?: number; b?: number }) {
  return (
    <tr className="border-t border-border-subtle/60">
      <td className="px-3 py-2 text-stone-300">{label}</td>
      <td className="px-3 py-2 text-end font-semibold text-white">
        {a == null ? "—" : a.toLocaleString()}
      </td>
      <td className="px-3 py-2 text-end font-semibold text-white">
        {b == null ? "—" : b.toLocaleString()}
      </td>
    </tr>
  );
}
