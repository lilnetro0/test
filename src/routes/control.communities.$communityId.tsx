import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import { getControlHub, type ControlHubDetail } from "@/lib/control/api";
import { useT, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/control/communities/$communityId")({
  component: CommunityLayout,
});

const TABS: { suffix: string; to: string; labelKey: TKey }[] = [
  { suffix: "", to: "/control/communities/$communityId", labelKey: "control.comm.tab.overview" },
  {
    suffix: "/channels",
    to: "/control/communities/$communityId/channels",
    labelKey: "control.comm.tab.channels",
  },
  {
    suffix: "/voice",
    to: "/control/communities/$communityId/voice",
    labelKey: "control.comm.tab.voice",
  },
  {
    suffix: "/members",
    to: "/control/communities/$communityId/members",
    labelKey: "control.comm.tab.members",
  },
  {
    suffix: "/settings",
    to: "/control/communities/$communityId/settings",
    labelKey: "control.comm.tab.settings",
  },
];

function CommunityLayout() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const { communityId } = Route.useParams();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [hub, setHub] = useState<ControlHubDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void getControlHub({ data: { accessToken, hubId: communityId } }).then((r) => {
      if (cancelled) return;
      if (!r.ok) {
        setError(r.error);
        setHub(null);
        return;
      }
      setHub(r.hub);
      setError(null);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, communityId]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-8">
      <Link to="/control/communities" className="text-xs font-semibold text-accent">
        ← {t("control.comm.back")}
      </Link>
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      {hub && (
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-accent">
            <Building2 className="size-5" />
            <p className="text-[10px] font-semibold uppercase tracking-widest">
              {t("control.nav.communities")}
            </p>
          </div>
          <h1 className="font-display text-2xl font-bold text-white">{hub.name}</h1>
          <p className="text-xs text-stone-500">
            {hub.slug}
            {hub.game_name ? ` · ${hub.game_name}` : ""}
            {hub.region ? ` · ${hub.region}` : ""} · {hub.member_count} {t("control.comm.members")}
          </p>
          <nav className="flex flex-wrap gap-1 border-b border-border-subtle pb-px pt-2">
            {TABS.map((tab) => {
              const base = `/control/communities/${communityId}`;
              const href = `${base}${tab.suffix}`;
              const active =
                tab.suffix === ""
                  ? pathname === base || pathname === `${base}/`
                  : pathname.startsWith(href);
              return (
                <Link
                  key={tab.suffix || "overview"}
                  to={tab.to}
                  params={{ communityId }}
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
      )}
      <Outlet />
    </div>
  );
}
