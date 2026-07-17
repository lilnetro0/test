import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-provider";
import {
  getControlAnalyticsOverview,
  type ControlAnalyticsOverview,
  type ControlAnalyticsRange,
} from "@/lib/control/api";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Search = { range?: string };

export const Route = createFileRoute("/control/analytics/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    range: s.range === "30" ? "30" : s.range === "7" ? "7" : undefined,
  }),
  component: AnalyticsOverviewPage,
});

function AnalyticsOverviewPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const { range: rangeParam } = Route.useSearch();
  const navigate = Route.useNavigate();
  const rangeDays: ControlAnalyticsRange = rangeParam === "30" ? 30 : 7;
  const [overview, setOverview] = useState<ControlAnalyticsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void getControlAnalyticsOverview({ data: { accessToken, rangeDays } }).then((r) => {
      if (cancelled) return;
      if (!r.ok) {
        setError(r.error);
        setOverview(null);
        return;
      }
      setError(null);
      setOverview(r.overview);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, rangeDays]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {([7, 30] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => void navigate({ search: { range: String(d) } })}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold",
              rangeDays === d
                ? "bg-accent/20 text-accent"
                : "bg-white/5 text-stone-400 hover:text-white",
            )}
          >
            {t("control.analytics.rangeDays", { n: String(d) })}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <p className="text-xs text-stone-500">{t("control.analytics.oltpNote")}</p>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label={t("control.analytics.kpi.active")}
          value={overview?.activeApprox}
          to="/control/users"
        />
        <Stat
          label={t("control.analytics.kpi.newUsers")}
          value={overview?.newUsers}
          to="/control/users"
        />
        <Stat
          label={t("control.analytics.kpi.newHubs")}
          value={overview?.newHubs}
          to="/control/communities"
        />
        <Stat
          label={t("control.analytics.kpi.messages")}
          value={overview?.newMessages}
          to="/control/analytics/engagement"
        />
        <Stat
          label={t("control.analytics.kpi.reports")}
          value={overview?.newReports}
          to="/control/moderation"
        />
        <Stat
          label={t("control.analytics.kpi.resolved")}
          value={overview?.resolvedReports}
          to="/control/enforcement"
        />
        <Stat
          label={t("control.analytics.kpi.bans")}
          value={overview?.bansInRange}
          to="/control/appeals"
        />
        <Stat
          label={t("control.analytics.kpi.voiceRooms")}
          value={overview?.voiceRooms}
          to="/control/voice/rooms"
        />
        <Stat
          label={t("control.analytics.kpi.usersTotal")}
          value={overview?.usersTotal}
          to="/control/users"
        />
      </div>

      <section className="rounded-xl border border-border-subtle p-4">
        <h2 className="text-sm font-semibold text-white">{t("control.analytics.regionMix")}</h2>
        {!overview || overview.regionMix.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">{t("control.analytics.regionEmpty")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {overview.regionMix.map((r) => (
              <li key={r.region} className="flex items-center justify-between text-sm">
                <span className="font-mono text-stone-300">{r.region}</span>
                <span className="text-white">{r.hubs}</span>
              </li>
            ))}
          </ul>
        )}
        <Link
          to="/control/community-health"
          className="mt-3 inline-block text-xs font-semibold text-accent"
        >
          {t("control.nav.communityHealth")} →
        </Link>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  to,
}: {
  label: string;
  value: number | undefined;
  to:
    | "/control/users"
    | "/control/communities"
    | "/control/analytics/engagement"
    | "/control/moderation"
    | "/control/enforcement"
    | "/control/appeals"
    | "/control/voice/rooms";
}) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-border-subtle bg-white/[0.03] p-4 transition-colors hover:border-accent/40 hover:bg-accent/5"
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-white">
        {value == null ? "—" : value.toLocaleString()}
      </p>
    </Link>
  );
}
