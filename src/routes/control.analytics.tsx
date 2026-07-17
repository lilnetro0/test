import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { useT, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/control/analytics")({
  component: AnalyticsLayout,
});

const TABS: { to: string; labelKey: TKey; match: (path: string) => boolean }[] = [
  {
    to: "/control/analytics",
    labelKey: "control.analytics.tab.overview",
    match: (p) => p === "/control/analytics" || p === "/control/analytics/",
  },
  {
    to: "/control/analytics/engagement",
    labelKey: "control.analytics.tab.engagement",
    match: (p) => p.startsWith("/control/analytics/engagement"),
  },
  {
    to: "/control/analytics/voice",
    labelKey: "control.analytics.tab.voice",
    match: (p) => p.startsWith("/control/analytics/voice"),
  },
];

function AnalyticsLayout() {
  const { t } = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-accent">
          <BarChart3 className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.analytics")}
          </p>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{t("control.analytics.title")}</h1>
        <p className="text-sm text-stone-400">{t("control.analytics.subtitle")}</p>
        <nav className="flex flex-wrap gap-1 border-b border-border-subtle pb-px pt-2">
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  "rounded-t-md px-3 py-2 text-xs font-semibold",
                  active
                    ? "border-b-2 border-accent text-accent"
                    : "text-stone-400 hover:text-white",
                )}
              >
                {t(tab.labelKey)}
              </Link>
            );
          })}
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
