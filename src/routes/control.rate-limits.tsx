import { createFileRoute } from "@tanstack/react-router";
import { Gauge } from "lucide-react";
import { CONTROL_RATE_LIMIT_POLICIES } from "@/lib/control/rate-limit-policies";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/rate-limits")({
  component: RateLimitsPage,
});

function RateLimitsPage() {
  const { t } = useT();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <Gauge className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.rateLimits")}
          </p>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{t("control.rate.title")}</h1>
        <p className="text-sm text-stone-400">{t("control.rate.subtitle")}</p>
      </header>

      <div className="overflow-hidden rounded-xl border border-border-subtle">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-[10px] uppercase tracking-widest text-stone-500">
            <tr>
              <th className="px-3 py-2 text-start font-semibold">{t("control.rate.scope")}</th>
              <th className="px-3 py-2 text-start font-semibold">{t("control.rate.burst")}</th>
              <th className="px-3 py-2 text-start font-semibold">{t("control.rate.sustained")}</th>
              <th className="px-3 py-2 text-start font-semibold">{t("control.rate.source")}</th>
            </tr>
          </thead>
          <tbody>
            {CONTROL_RATE_LIMIT_POLICIES.map((p) => (
              <tr key={p.id} className="border-t border-border-subtle/60">
                <td className="px-3 py-2 text-white">{p.scope}</td>
                <td className="px-3 py-2 font-mono text-xs text-stone-300">{p.burst}</td>
                <td className="px-3 py-2 font-mono text-xs text-stone-300">{p.sustained}</td>
                <td className="px-3 py-2 font-mono text-[10px] text-stone-500">{p.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
