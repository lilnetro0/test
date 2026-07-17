import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Rocket } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import { getControlAnalyticsOverview, type ControlAnalyticsOverview } from "@/lib/control/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/growth")({
  component: GrowthPage,
});

function GrowthPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const [overview, setOverview] = useState<ControlAnalyticsOverview | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void getControlAnalyticsOverview({ data: { accessToken, rangeDays: 7 } }).then((r) => {
      if (cancelled || !r.ok) return;
      setOverview(r.overview);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <Rocket className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.growth")}
          </p>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{t("control.growth.title")}</h1>
        <p className="text-sm text-stone-400">{t("control.growth.subtitle")}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card label={t("control.analytics.kpi.newUsers")} value={overview?.newUsers} />
        <Card label={t("control.analytics.kpi.newHubs")} value={overview?.newHubs} />
        <Card label={t("control.analytics.kpi.active")} value={overview?.activeApprox} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/control/discovery"
          className="rounded-xl border border-border-subtle bg-white/[0.03] p-4 hover:border-accent/40"
        >
          <h2 className="font-semibold text-white">{t("control.nav.discovery")}</h2>
          <p className="mt-1 text-xs text-stone-400">{t("control.growth.discoveryBody")}</p>
        </Link>
        <Link
          to="/control/announcements"
          className="rounded-xl border border-border-subtle bg-white/[0.03] p-4 hover:border-accent/40"
        >
          <h2 className="font-semibold text-white">{t("control.ann.title")}</h2>
          <p className="mt-1 text-xs text-stone-400">{t("control.growth.annBody")}</p>
        </Link>
        <Link
          to="/control/community-health"
          className="rounded-xl border border-border-subtle bg-white/[0.03] p-4 hover:border-accent/40"
        >
          <h2 className="font-semibold text-white">{t("control.nav.communityHealth")}</h2>
          <p className="mt-1 text-xs text-stone-400">{t("control.growth.healthBody")}</p>
        </Link>
        <Link
          to="/control/analytics"
          className="rounded-xl border border-border-subtle bg-white/[0.03] p-4 hover:border-accent/40"
        >
          <h2 className="font-semibold text-white">{t("control.nav.analytics")}</h2>
          <p className="mt-1 text-xs text-stone-400">{t("control.growth.analyticsBody")}</p>
        </Link>
      </div>

      <section className="rounded-xl border border-border-subtle p-4">
        <h2 className="text-sm font-semibold text-white">{t("control.analytics.regionMix")}</h2>
        {!overview || overview.regionMix.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">{t("control.analytics.regionEmpty")}</p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm">
            {overview.regionMix.slice(0, 6).map((r) => (
              <li key={r.region} className="flex justify-between">
                <span className="font-mono text-stone-300">{r.region}</span>
                <span className="text-white">{r.hubs}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-white/[0.03] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-white">
        {value == null ? "—" : value.toLocaleString()}
      </p>
    </div>
  );
}
