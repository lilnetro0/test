import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ScrollText,
  Search,
  Flag,
  Users,
  Building2,
  Gamepad2,
  Mic,
  BarChart3,
  HeartPulse,
  Activity,
  Inbox,
} from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import { getControlDashboardKpis, type ControlDashboardKpis } from "@/lib/control/api";
import { useT, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/control/")({
  component: ControlDashboard,
});

const ATTENTION_KEYS: Record<ControlDashboardKpis["attention"][number]["id"], TKey> = {
  open_reports: "control.dash.attention.openReports",
  reviewing_reports: "control.dash.attention.reviewing",
  banned_users: "control.dash.attention.banned",
  livekit: "control.dash.attention.livekit",
};

/** Command dashboard — P0–P6 KPIs + entry points. */
function ControlDashboard() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const [kpis, setKpis] = useState<ControlDashboardKpis | null>(null);
  const [kpiError, setKpiError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void getControlDashboardKpis({ data: { accessToken } }).then((r) => {
      if (cancelled) return;
      if (!r.ok) {
        setKpiError(r.error);
        setKpis(null);
        return;
      }
      setKpiError(null);
      setKpis(r.kpis);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const cards = [
    {
      to: "/control/inbox" as const,
      icon: Inbox,
      title: t("control.inbox.title"),
      body: t("control.inbox.subtitle"),
    },
    {
      to: "/control/system" as const,
      icon: Activity,
      title: t("control.dash.systemTitle"),
      body: t("control.dash.systemBody"),
    },
    {
      to: "/control/analytics" as const,
      icon: BarChart3,
      title: t("control.dash.analyticsTitle"),
      body: t("control.dash.analyticsBody"),
    },
    {
      to: "/control/community-health" as const,
      icon: HeartPulse,
      title: t("control.dash.healthTitle"),
      body: t("control.dash.healthBody"),
    },
    {
      to: "/control/moderation" as const,
      icon: Flag,
      title: t("control.dash.modTitle"),
      body: t("control.dash.modBody"),
    },
    {
      to: "/control/users" as const,
      icon: Users,
      title: t("control.dash.usersTitle"),
      body: t("control.dash.usersBody"),
    },
    {
      to: "/control/communities" as const,
      icon: Building2,
      title: t("control.dash.commTitle"),
      body: t("control.dash.commBody"),
    },
    {
      to: "/control/games" as const,
      icon: Gamepad2,
      title: t("control.dash.gamesTitle"),
      body: t("control.dash.gamesBody"),
    },
    {
      to: "/control/voice" as const,
      icon: Mic,
      title: t("control.dash.voiceTitle"),
      body: t("control.dash.voiceBody"),
    },
    {
      to: "/control/search" as const,
      icon: Search,
      title: t("control.dash.searchTitle"),
      body: t("control.dash.searchBody"),
    },
    {
      to: "/control/audit" as const,
      icon: ScrollText,
      title: t("control.dash.auditTitle"),
      body: t("control.dash.auditBody"),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <LayoutDashboard className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.group.command")}
          </p>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{t("control.dash.title")}</h1>
        <p className="max-w-xl text-sm text-stone-400">{t("control.dash.subtitle")}</p>
      </header>

      {kpiError && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {kpiError}
        </p>
      )}

      {kpis && kpis.attention.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">
            {t("control.dash.attentionTitle")}
          </h2>
          <ul className="space-y-2">
            {kpis.attention.map((item) => (
              <li key={item.id}>
                <a
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors",
                    item.severity === "high"
                      ? "border-red-500/40 bg-red-500/10 text-red-200 hover:border-red-400"
                      : item.severity === "medium"
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-100 hover:border-amber-400"
                        : "border-border-subtle bg-white/[0.03] text-stone-300 hover:border-accent/40",
                  )}
                >
                  <span>
                    {t(ATTENTION_KEYS[item.id], {
                      n: String(item.count ?? 0),
                    })}
                  </span>
                  <span className="text-xs font-semibold opacity-80">→</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">
          {t("control.dash.kpiTitle")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Kpi
            label={t("control.dash.kpi.dau")}
            value={kpis?.dauApprox}
            to="/control/analytics"
          />
          <Kpi
            label={t("control.dash.kpi.messages7d")}
            value={kpis?.messages7d}
            to="/control/analytics/engagement"
          />
          <Kpi
            label={t("control.dash.kpi.openReports")}
            value={kpis?.openReports}
            to="/control/moderation"
          />
          <Kpi
            label={t("control.dash.kpi.hubs")}
            value={kpis?.hubsTotal}
            hint={
              kpis ? t("control.dash.kpi.hubsNew", { n: String(kpis.hubsNew7d) }) : undefined
            }
            to="/control/communities"
          />
          <Kpi
            label={t("control.dash.kpi.users")}
            value={kpis?.usersTotal}
            hint={
              kpis ? t("control.dash.kpi.usersNew", { n: String(kpis.usersNew7d) }) : undefined
            }
            to="/control/users"
          />
          <Kpi
            label={t("control.dash.kpi.voice")}
            value={kpis?.voiceRooms}
            to="/control/voice"
          />
        </div>
        <p className="text-[10px] text-stone-600">{t("control.analytics.oltpNote")}</p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="rounded-xl border border-border-subtle bg-white/[0.03] p-4 transition-colors hover:border-accent/40 hover:bg-accent/5"
          >
            <c.icon className="mb-3 size-5 text-accent" />
            <h2 className="font-semibold text-white">{c.title}</h2>
            <p className="mt-1 text-xs text-stone-400">{c.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  to,
}: {
  label: string;
  value: number | undefined;
  hint?: string;
  to:
    | "/control/analytics"
    | "/control/analytics/engagement"
    | "/control/moderation"
    | "/control/communities"
    | "/control/users"
    | "/control/voice";
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
      {hint && <p className="mt-1 text-[10px] text-stone-500">{hint}</p>}
    </Link>
  );
}
