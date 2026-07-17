import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ToggleLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import {
  listControlFeatureFlags,
  setControlFeatureFlag,
  type ControlFeatureFlagRow,
} from "@/lib/control/api";
import { CONTROL_FLAG_CATALOG } from "@/lib/control/flags";
import { useT, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/control/flags")({
  component: FeatureFlagsPage,
});

function FeatureFlagsPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const [flags, setFlags] = useState<ControlFeatureFlagRow[]>([]);
  const [migrated, setMigrated] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = async () => {
    if (!accessToken) return;
    const r = await listControlFeatureFlags({ data: { accessToken } });
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setError(null);
    setMigrated(r.migrated);
    setFlags(r.flags);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const toggle = async (flag: ControlFeatureFlagRow) => {
    if (!accessToken) return;
    setBusyKey(flag.key);
    const r = await setControlFeatureFlag({
      data: { accessToken, key: flag.key, enabled: !flag.enabled },
    });
    setBusyKey(null);
    if (!r.ok) toast.error(r.error);
    else {
      toast.success(t("control.flags.saved"));
      void load();
    }
  };

  const descFor = (flag: ControlFeatureFlagRow): string => {
    const catalog = CONTROL_FLAG_CATALOG.find((f) => f.key === flag.key);
    if (catalog) return t(catalog.descKey as TKey);
    return flag.description || flag.key;
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <ToggleLeft className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.flags")}
          </p>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{t("control.flags.title")}</h1>
        <p className="text-sm text-stone-400">{t("control.flags.subtitle")}</p>
      </header>

      {!migrated && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {t("control.flags.needMigration")}
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <ul className="overflow-hidden rounded-xl border border-border-subtle">
        {flags.map((flag) => (
          <li
            key={flag.key}
            className="flex flex-wrap items-center gap-3 border-b border-border-subtle/60 px-3 py-3 last:border-0"
          >
            <div className="min-w-0 flex-1">
              <p className="font-mono text-sm font-semibold text-white">{flag.key}</p>
              <p className="text-xs text-stone-400">{descFor(flag)}</p>
            </div>
            <span
              className={cn(
                "rounded px-2 py-0.5 text-[10px] font-semibold uppercase",
                flag.enabled ? "bg-emerald-500/20 text-emerald-300" : "bg-stone-500/20 text-stone-400",
              )}
            >
              {flag.enabled ? t("control.flags.on") : t("control.flags.off")}
            </span>
            <button
              type="button"
              disabled={!migrated || busyKey === flag.key}
              onClick={() => void toggle(flag)}
              className="rounded-lg bg-accent/20 px-3 py-1.5 text-xs font-semibold text-accent disabled:opacity-40"
            >
              {flag.enabled ? t("control.flags.kill") : t("control.flags.enable")}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
