import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import { listControlIntegrations, type ControlIntegrationStatus } from "@/lib/control/api";
import { useT, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/control/keys")({
  component: ApiKeysPage,
});

const ID_KEYS: Record<string, TKey> = {
  supabase_public: "control.keys.id.supabasePublic",
  supabase_service_role: "control.keys.id.serviceRole",
  livekit: "control.keys.id.livekit",
  ops_webhook: "control.keys.id.opsWebhook",
  pagerduty: "control.keys.id.pagerduty",
};

function ApiKeysPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<ControlIntegrationStatus[]>([]);
  const [adminEnvCount, setAdminEnvCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void listControlIntegrations({ data: { accessToken } }).then((r) => {
      if (cancelled) return;
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setError(null);
      setRows(r.integrations);
      setAdminEnvCount(r.adminEnvCount);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <KeyRound className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.keys")}
          </p>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{t("control.keys.title")}</h1>
        <p className="text-sm text-stone-400">{t("control.keys.subtitle")}</p>
      </header>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <p className="rounded-lg border border-border-subtle bg-white/[0.03] px-3 py-2 text-xs text-stone-400">
        {t("control.keys.adminEnv", { n: String(adminEnvCount) })}
      </p>

      <ul className="overflow-hidden rounded-xl border border-border-subtle">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-center gap-3 border-b border-border-subtle/60 px-3 py-2.5 last:border-0"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">
                {t((ID_KEYS[row.id] ?? "control.keys.id.generic") as TKey)}
              </p>
              {row.host && <p className="font-mono text-xs text-stone-500">{row.host}</p>}
            </div>
            <span
              className={cn(
                "text-[10px] font-semibold uppercase",
                row.configured ? "text-emerald-300" : "text-stone-500",
              )}
            >
              {row.configured ? t("control.keys.configured") : t("control.keys.missing")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
