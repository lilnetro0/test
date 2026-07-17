import { createFileRoute, Link } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/tasks")({
  component: TasksPage,
});

/** Tasks alias — cross-team work lives in Inbox for P6. */
function TasksPage() {
  const { t } = useT();
  return (
    <div className="mx-auto w-full max-w-lg space-y-3 p-8 text-center">
      <h1 className="font-display text-xl font-bold text-white">{t("control.nav.tasks")}</h1>
      <p className="text-sm text-stone-400">{t("control.tasks.redirect")}</p>
      <Link to="/control/inbox" className="inline-block text-sm font-semibold text-accent">
        {t("control.inbox.title")} →
      </Link>
    </div>
  );
}
