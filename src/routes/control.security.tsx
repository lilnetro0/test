import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import { getControlSecurityPosture, type ControlSecurityPosture } from "@/lib/control/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/security")({
  component: SecurityCenterPage,
});

function SecurityCenterPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const [posture, setPosture] = useState<ControlSecurityPosture | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void getControlSecurityPosture({ data: { accessToken } }).then((r) => {
      if (cancelled) return;
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setError(null);
      setPosture(r.posture);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <ShieldAlert className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.safety")}
          </p>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{t("control.security.title")}</h1>
        <p className="text-sm text-stone-400">{t("control.security.subtitle")}</p>
      </header>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {posture && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label={t("control.security.admins")} value={posture.adminCount} />
            <Stat label={t("control.security.bootstrap")} value={posture.adminEnvBootstrap} />
            <Stat label={t("control.security.openReports")} value={posture.openReports} />
            <Stat label={t("control.security.banned")} value={posture.bannedUsers} />
            <Stat
              label={t("control.security.livekit")}
              value={
                posture.livekitOk === null
                  ? t("control.system.status.off")
                  : posture.livekitOk
                    ? t("control.system.status.ok")
                    : t("control.system.status.down")
              }
            />
            <Stat
              label={t("control.security.maintenance")}
              value={posture.maintenanceOn ? t("control.flags.on") : t("control.flags.off")}
            />
          </div>

          <p className="text-xs text-stone-500">{t("control.security.breakGlass")}</p>

          <div className="flex flex-wrap gap-3 text-xs font-semibold">
            <Link to="/control/roles" className="text-accent">
              {t("control.nav.roles")} →
            </Link>
            <Link to="/control/audit" className="text-stone-400 hover:text-accent">
              {t("control.nav.audit")} →
            </Link>
            <Link to="/control/rate-limits" className="text-stone-400 hover:text-accent">
              {t("control.nav.rateLimits")} →
            </Link>
            <Link to="/control/flags" className="text-stone-400 hover:text-accent">
              {t("control.nav.flags")} →
            </Link>
          </div>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-white">{t("control.security.recent")}</h2>
            <ul className="overflow-hidden rounded-xl border border-border-subtle">
              {posture.recentSensitive.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-stone-500">
                  {t("control.security.recentEmpty")}
                </li>
              ) : (
                posture.recentSensitive.map((e) => (
                  <li
                    key={e.id}
                    className="flex flex-wrap items-center gap-2 border-b border-border-subtle/60 px-3 py-2 text-sm last:border-0"
                  >
                    <Link
                      to="/control/audit/$eventId"
                      params={{ eventId: e.id }}
                      className="font-mono text-xs text-accent"
                    >
                      {e.action}
                    </Link>
                    <span className="font-mono text-[10px] text-stone-500">{e.actor_id.slice(0, 8)}…</span>
                    <span className="ms-auto text-[10px] text-stone-500">
                      {new Date(e.created_at).toLocaleString()}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-white/[0.03] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">{label}</p>
      <p className="mt-1 font-display text-xl font-bold text-white">{value}</p>
    </div>
  );
}
