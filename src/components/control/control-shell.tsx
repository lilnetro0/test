import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Search,
  Shield,
  ScrollText,
  Menu,
  X,
  ExternalLink,
  Flag,
  Users,
  Scale,
  Gavel,
  Building2,
  Gamepad2,
  Hash,
  ImageIcon,
  Layers,
  Mic,
  Activity,
  HardDrive,
  BarChart3,
  HeartPulse,
  ToggleLeft,
  ListTodo,
  KeyRound,
  Gauge,
  Settings,
  Shield,
  Inbox,
  Megaphone,
  Compass,
  Rocket,
  ShieldAlert,
} from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { ControlSearchDialog } from "@/components/control/control-search-dialog";
import { useControlAccess } from "@/hooks/use-control-access";
import { CONTROL_NAV } from "@/lib/control/nav";
import { hasPermission } from "@/lib/control/permissions";
import { useAuth } from "@/lib/auth-provider";
import { useT, type TKey } from "@/lib/i18n";
import { useHotkey } from "@/hooks/use-hotkey";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  search: Search,
  audit: ScrollText,
  moderation: Flag,
  users: Users,
  appeals: Scale,
  enforcement: Gavel,
  communities: Building2,
  catalog: Gamepad2,
  channels: Hash,
  media: ImageIcon,
  templates: Layers,
  voice: Mic,
  live: Activity,
  livekit: HardDrive,
  analytics: BarChart3,
  "community-health": HeartPulse,
  flags: ToggleLeft,
  health: HeartPulse,
  jobs: ListTodo,
  keys: KeyRound,
  "rate-limits": Gauge,
  roles: Shield,
  settings: Settings,
  notifications: Inbox,
  tasks: Inbox,
  content: Megaphone,
  discovery: Compass,
  growth: Rocket,
  safety: ShieldAlert,
  "legacy-admin": ExternalLink,
};

/**
 * Desktop-first Control shell — no consumer BottomDock / GlobalVoiceBar.
 * Blueprint §1.
 */
export function ControlShell({ children }: { children?: ReactNode }) {
  const access = useControlAccess();
  const { t } = useT();
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useHotkey("mod+k", () => setSearchOpen((v) => !v), { allowInInputs: true });

  const groups = useMemo(() => {
    if (access.status !== "ok") return [];
    return CONTROL_NAV.map((g) => ({
      ...g,
      items: g.items.filter((item) => hasPermission(access.permissions, item.permission)),
    })).filter((g) => g.items.length > 0);
  }, [access]);

  if (access.status === "loading") {
    return (
      <RequireAuth>
        <div className="grid h-dvh place-items-center bg-background text-stone-400">
          <p className="text-xs font-semibold uppercase tracking-widest">{t("control.checking")}</p>
        </div>
      </RequireAuth>
    );
  }

  if (access.status === "denied") {
    return (
      <RequireAuth>
        <div className="grid h-dvh place-items-center bg-background px-6 text-center">
          <div className="max-w-md space-y-3">
            <Shield className="mx-auto size-8 text-stone-500" />
            <h1 className="font-display text-lg font-bold text-white">
              {t("control.deniedTitle")}
            </h1>
            <p className="text-sm text-stone-400">{t("control.denied")}</p>
            <Link to="/" className="inline-block text-sm font-semibold text-accent">
              {t("control.backHome")}
            </Link>
          </div>
        </div>
      </RequireAuth>
    );
  }

  const envLabel =
    import.meta.env.DEV || import.meta.env.MODE === "development"
      ? t("control.env.dev")
      : t("control.env.prod");

  const nav = (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-4">
      <div className="px-2">
        <p className="font-display text-sm font-bold tracking-tight text-white">
          {t("control.brand")}
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
          {t("control.brandSub")}
        </p>
      </div>
      {groups.map((group) => (
        <div key={group.id}>
          <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
            {t(group.labelKey as TKey)}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = ICONS[item.id] ?? Shield;
              const active =
                item.to === "/control"
                  ? pathname === "/control" || pathname === "/control/"
                  : pathname === item.to || pathname.startsWith(`${item.to}/`);
              const soon = item.phase !== "p0" && item.phase !== "legacy";
              const className = cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors",
                active
                  ? "bg-accent/15 font-semibold text-accent"
                  : "text-stone-300 hover:bg-white/5 hover:text-white",
              );
              const label = (
                <>
                  <Icon className="size-4 shrink-0 opacity-80" />
                  <span className="min-w-0 flex-1 truncate">{t(item.labelKey as TKey)}</span>
                  {soon && (
                    <span className="text-[9px] font-semibold uppercase tracking-wide text-stone-500">
                      {item.phase.toUpperCase()}
                    </span>
                  )}
                </>
              );
              return (
                <li key={item.id}>
                  <Link to={item.to} className={className} onClick={() => setNavOpen(false)}>
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <RequireAuth>
      <div className="flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-background text-foreground">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border-subtle px-3 md:px-4">
          <button
            type="button"
            className="grid size-9 place-items-center rounded-lg text-stone-300 hover:bg-white/5 md:hidden"
            aria-label={t("control.toggleNav")}
            onClick={() => setNavOpen((v) => !v)}
          >
            {navOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              import.meta.env.DEV
                ? "bg-amber-500/20 text-amber-300"
                : "bg-emerald-500/15 text-emerald-300",
            )}
          >
            {envLabel}
          </span>
          <span className="hidden font-display text-sm font-bold text-white sm:inline">
            {t("control.brand")}
          </span>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="ms-auto flex max-w-xs flex-1 items-center gap-2 rounded-lg border border-border-subtle bg-white/5 px-3 py-1.5 text-start text-xs text-stone-400 hover:border-stone-500"
          >
            <Search className="size-3.5 shrink-0" />
            <span className="truncate">{t("control.search.placeholder")}</span>
            <kbd className="ms-auto hidden rounded border border-border-subtle px-1 text-[10px] text-stone-500 sm:inline">
              ⌘K
            </kbd>
          </button>
          <span className="hidden max-w-[10rem] truncate text-xs text-stone-400 sm:inline">
            {user?.email ?? access.userId.slice(0, 8)}
          </span>
        </header>

        <div className="relative flex min-h-0 flex-1">
          <aside className="hidden w-56 shrink-0 border-e border-border-subtle bg-black/20 md:block">
            {nav}
          </aside>
          {navOpen && (
            <div className="absolute inset-0 z-40 flex md:hidden">
              <aside className="w-64 border-e border-border-subtle bg-background shadow-xl">
                {nav}
              </aside>
              <button
                type="button"
                className="flex-1 bg-black/50"
                aria-label={t("control.closeNav")}
                onClick={() => setNavOpen(false)}
              />
            </div>
          )}
          <main id="main-content" className="min-h-0 min-w-0 flex-1 overflow-y-auto">
            {children ?? <Outlet />}
          </main>
        </div>

        <ControlSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      </div>
    </RequireAuth>
  );
}
