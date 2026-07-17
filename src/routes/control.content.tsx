import { createFileRoute, Link } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/content")({
  component: ContentHubPage,
});

/** Content hub — announcements + media entry. */
function ContentHubPage() {
  const { t } = useT();
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold text-white">{t("control.nav.content")}</h1>
      <p className="text-sm text-stone-400">{t("control.content.subtitle")}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/control/announcements"
          className="rounded-xl border border-border-subtle bg-white/[0.03] p-4 hover:border-accent/40"
        >
          <h2 className="font-semibold text-white">{t("control.ann.title")}</h2>
          <p className="mt-1 text-xs text-stone-400">{t("control.ann.subtitle")}</p>
        </Link>
        <Link
          to="/control/media"
          className="rounded-xl border border-border-subtle bg-white/[0.03] p-4 hover:border-accent/40"
        >
          <h2 className="font-semibold text-white">{t("control.nav.media")}</h2>
          <p className="mt-1 text-xs text-stone-400">{t("control.media.subtitle")}</p>
        </Link>
      </div>
    </div>
  );
}
