import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/settings")({
  component: ControlSettingsPage,
});

function ControlSettingsPage() {
  const { t } = useT();
  const envLabel =
    import.meta.env.DEV || import.meta.env.MODE === "development"
      ? t("control.env.dev")
      : t("control.env.prod");

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <Settings className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.settings")}
          </p>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{t("control.settings.title")}</h1>
        <p className="text-sm text-stone-400">{t("control.settings.subtitle")}</p>
      </header>

      <dl className="space-y-3 rounded-xl border border-border-subtle p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-stone-500">{t("control.settings.env")}</dt>
          <dd className="font-semibold text-white">{envLabel}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-stone-500">{t("control.settings.locale")}</dt>
          <dd className="font-semibold text-white">{t("control.settings.localeValue")}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-3 text-xs font-semibold">
        <Link to="/control/system" className="text-accent">
          {t("control.nav.health")} →
        </Link>
        <Link to="/control/roles" className="text-stone-400 hover:text-accent">
          {t("control.nav.roles")} →
        </Link>
        <Link to="/control/flags" className="text-stone-400 hover:text-accent">
          {t("control.nav.flags")} →
        </Link>
      </div>
    </div>
  );
}
