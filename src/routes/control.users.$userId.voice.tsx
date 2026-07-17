import { createFileRoute, Link } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/users/$userId/voice")({
  component: UserVoicePage,
});

/** Per-user voice history store is still deferred; P3 ops live under Voice. */
function UserVoicePage() {
  const { t } = useT();
  return (
    <div className="rounded-xl border border-dashed border-border-subtle p-6 text-center">
      <p className="text-sm text-stone-400">{t("control.user.voiceSoon")}</p>
      <Link to="/control/voice" className="mt-3 inline-block text-xs font-semibold text-accent">
        {t("control.nav.voice")}
      </Link>
    </div>
  );
}
