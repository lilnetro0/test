import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import { getControlUser, type ControlUserDetail } from "@/lib/control/api";
import { useT, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/control/users/$userId")({
  component: ControlUserLayout,
});

const TABS: { to: string; labelKey: TKey; suffix: string }[] = [
  { to: "/control/users/$userId", labelKey: "control.user.tab.overview", suffix: "" },
  {
    to: "/control/users/$userId/memberships",
    labelKey: "control.user.tab.memberships",
    suffix: "/memberships",
  },
  {
    to: "/control/users/$userId/moderation",
    labelKey: "control.user.tab.moderation",
    suffix: "/moderation",
  },
  { to: "/control/users/$userId/voice", labelKey: "control.user.tab.voice", suffix: "/voice" },
  { to: "/control/users/$userId/notes", labelKey: "control.user.tab.notes", suffix: "/notes" },
];

function ControlUserLayout() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const { userId } = Route.useParams();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [user, setUser] = useState<ControlUserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void getControlUser({ data: { accessToken, userId } }).then((r) => {
      if (cancelled) return;
      if (!r.ok) {
        setError(r.error);
        setUser(null);
        return;
      }
      setUser(r.user);
      setError(null);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, userId]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-8">
      <Link to="/control/users" className="text-xs font-semibold text-accent">
        ← {t("control.user.back")}
      </Link>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {user && (
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-accent">
            <Users className="size-5" />
            <p className="text-[10px] font-semibold uppercase tracking-widest">
              {t("control.nav.users")}
            </p>
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            {user.username}
            <span className="ms-1 font-mono text-base text-stone-500">#{user.tag}</span>
          </h1>
          <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide">
            {user.banned_at ? (
              <span className="rounded bg-red-500/20 px-2 py-0.5 text-red-300">
                {t("control.user.banned")}
              </span>
            ) : (
              <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-emerald-300">
                {t("control.user.active")}
              </span>
            )}
            {user.is_platform_admin && (
              <span className="rounded bg-accent/20 px-2 py-0.5 text-accent">
                {t("control.user.platformAdmin")}
              </span>
            )}
          </div>
          <nav className="flex flex-wrap gap-1 border-b border-border-subtle pb-px pt-2">
            {TABS.map((tab) => {
              const base = `/control/users/${userId}`;
              const href = `${base}${tab.suffix}`;
              const active =
                tab.suffix === ""
                  ? pathname === base || pathname === `${base}/`
                  : pathname.startsWith(href);
              return (
                <Link
                  key={tab.suffix || "overview"}
                  to={tab.to}
                  params={{ userId }}
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
