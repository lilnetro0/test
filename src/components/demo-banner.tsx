import { shouldUseMockData } from "@/lib/supabase/env";
import { useT } from "@/lib/i18n";

/** Persistent chrome when the app is running on mock / demo data. */
export function DemoBanner() {
  const { t } = useT();
  if (!shouldUseMockData()) return null;
  return (
    <div
      role="status"
      className="shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-center text-[11px] font-semibold text-amber-100"
    >
      {t("demo.banner")}
    </div>
  );
}
