import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Home,
  Compass,
  MessageSquare,
  User,
  Bell,
  Users,
  Settings as SettingsIcon,
  LogOut,
  UserCircle,
} from "lucide-react";
import logo from "@/assets/nexus-logo.png";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-provider";
import { useNotifications } from "@/lib/notifications-provider";
import { useMessageUnreadTotals } from "@/hooks/use-message-unread-totals";
import { trapFocus } from "@/lib/focus-trap";
import { toast } from "sonner";

/**
 * Persistent bottom dock — the ONLY primary navigation surface in the app.
 * Center brand always opens the hub sheet (navigates home with ?hubs=1 when needed).
 */
type Props = {
  onBrandClick?: () => void;
  brandActive?: boolean;
};

export function BottomDock({ onBrandClick, brandActive }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [youOpen, setYouOpen] = useState(false);
  const { t } = useT();
  const { unreadCount } = useNotifications();
  const { channelUnread, dmUnread } = useMessageUnreadTotals();
  const isHome = pathname === "/";
  const inYouSection =
    pathname.startsWith("/friends") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/profile") ||
    pathname === "/me";

  const openHubs = () => {
    if (isHome && onBrandClick) {
      onBrandClick();
      return;
    }
    void navigate({ to: "/", search: { hubs: "1" } as const });
  };

  return (
    <>
      <nav
        aria-label={t("a11y.primaryNav")}
        className="bottom-dock relative z-30 flex min-h-[var(--dock-base-height)] shrink-0 items-center justify-around gap-1 border-t border-border-subtle bg-surface-left/95 px-2 pb-safe pt-1 backdrop-blur-xl"
      >
        <DockItem
          to="/"
          icon={<Home className="size-5" />}
          label={t("nav.home")}
          active={isHome}
          badge={channelUnread}
        />
        <DockItem
          to="/discover"
          icon={<Compass className="size-5" />}
          label={t("nav.discover")}
          active={pathname.startsWith("/discover")}
        />

        <button
          type="button"
          onClick={openHubs}
          aria-label={t("nav.openHubs")}
          className={`grid size-12 place-items-center rounded-2xl border transition-all md:size-14 md:-translate-y-2 ${
            brandActive
              ? "border-accent bg-accent/15 shadow-[var(--shadow-glow-accent)]"
              : "border-accent/40 bg-accent/10 hover:border-accent hover:shadow-[var(--shadow-glow-accent)]"
          }`}
        >
          <img src={logo} alt="" width={28} height={28} className="size-6 object-contain md:size-7" />
        </button>

        <DockItem
          to="/dm"
          icon={<MessageSquare className="size-5" />}
          label={t("nav.messages")}
          active={pathname.startsWith("/dm")}
          badge={dmUnread}
        />

        <button
          type="button"
          onClick={() => setYouOpen((v) => !v)}
          aria-label={t("nav.you")}
          aria-expanded={youOpen}
          className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 transition-colors ${
            youOpen || inYouSection ? "text-accent" : "text-stone-500 hover:text-stone-200"
          }`}
        >
          <span className="relative">
            <User className="size-5" />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -end-1 size-2 rounded-full bg-danger ring-2 ring-surface-left" />
            ) : null}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide">{t("nav.you")}</span>
        </button>
      </nav>

      {youOpen && <YouMenu onClose={() => setYouOpen(false)} pathname={pathname} />}
    </>
  );
}

function DockItem({
  to,
  icon,
  label,
  active,
  badge,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      to={to}
      aria-label={badge && badge > 0 ? `${label} (${badge})` : label}
      className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 transition-colors ${
        active ? "text-accent" : "text-stone-500 hover:text-stone-200"
      }`}
    >
      <span className="relative">
        {icon}
        {badge && badge > 0 ? (
          <span className="absolute -top-1.5 -end-2 min-w-[1rem] rounded-full bg-danger px-1 text-center text-[9px] font-bold leading-4 text-white ring-2 ring-surface-left">
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
    </Link>
  );
}

function YouMenu({ onClose, pathname }: { onClose: () => void; pathname: string }) {
  const { t } = useT();
  const { profile, configured, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const releaseTrap = rootRef.current ? trapFocus(rootRef.current) : () => undefined;
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      releaseTrap();
    };
  }, [onClose]);
  const items = [
    { to: "/friends", icon: Users, label: t("nav.friends"), hint: t("you.friendsHint") },
    {
      to: "/notifications",
      icon: Bell,
      label: t("nav.notifications"),
      hint:
        unreadCount > 0
          ? t("you.alertsHintCount", { n: String(unreadCount) })
          : t("you.alertsHintNone"),
      badge: unreadCount,
    },
    { to: "/settings", icon: SettingsIcon, label: t("nav.settings"), hint: t("you.settingsHint") },
  ] as const;

  const displayName = profile?.display_name || profile?.username || t("nav.you");

  return (
    <div ref={rootRef} className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={t("nav.you")}>
      <button
        aria-label={t("onboarding.close")}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="bottom-dock-clearance absolute inset-x-2 rounded-2xl border border-border-subtle bg-surface-mid p-2 shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-150 md:inset-x-auto md:end-3 md:w-80">
        <Link
          to="/me"
          onClick={onClose}
          className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3 hover:bg-white/[0.06]"
        >
          <div className="grid size-11 shrink-0 place-items-center rounded-full border border-accent/40 bg-accent/10 text-accent">
            <UserCircle className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{displayName}</p>
            <p className="truncate text-[11px] text-online">
              ● {profile?.status_text || t("you.online")}
              {profile?.tag ? ` · #${profile.tag}` : ""}
            </p>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
            {t("you.viewProfile")}
          </span>
        </Link>

        <div className="my-2 h-px bg-border-subtle" />

        <div className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                  active ? "bg-accent/10 text-accent" : "text-stone-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1 text-sm font-semibold">{item.label}</span>
                {"badge" in item && item.badge > 0 && (
                  <span className="min-w-5 rounded-full bg-danger px-1.5 text-center text-[10px] font-bold text-white">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
                <span className="hidden truncate text-[10px] text-stone-500 md:inline">{item.hint}</span>
              </Link>
            );
          })}
        </div>

        <div className="my-2 h-px bg-border-subtle" />

        <button
          type="button"
          onClick={async () => {
            onClose();
            if (configured) {
              const result = await signOut();
              if (!result.ok) toast.error(result.error);
            }
            window.location.href = "/login";
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-stone-400 transition-colors hover:bg-danger/10 hover:text-danger"
        >
          <LogOut className="size-4" />
          <span>{t("nav.logout")}</span>
        </button>
      </div>
    </div>
  );
}
