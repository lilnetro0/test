import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { useT, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/control/announcements")({
  component: AnnouncementsLayout,
});

const TABS: { to: string; labelKey: TKey; match: (p: string) => boolean }[] = [
  {
    to: "/control/announcements",
    labelKey: "control.ann.tab.list",
    match: (p) => p === "/control/announcements" || p === "/control/announcements/",
  },
  {
    to: "/control/announcements/new",
    labelKey: "control.ann.tab.new",
    match: (p) => p.startsWith("/control/announcements/new"),
  },
];

function AnnouncementsLayout() {
  const { t } = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-accent">
          <Megaphone className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.content")}
          </p>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{t("control.ann.title")}</h1>
        <p className="text-sm text-stone-400">{t("control.ann.subtitle")}</p>
        <nav className="flex flex-wrap gap-1 border-b border-border-subtle pb-px pt-2">
          {TABS.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "rounded-t-md px-3 py-2 text-xs font-semibold",
                tab.match(pathname)
                  ? "border-b-2 border-accent text-accent"
                  : "text-stone-400 hover:text-white",
              )}
            >
              {t(tab.labelKey)}
            </Link>
          ))}
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
