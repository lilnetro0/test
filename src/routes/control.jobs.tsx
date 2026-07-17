import { createFileRoute } from "@tanstack/react-router";
import { ListTodo } from "lucide-react";
import { CONTROL_JOBS_CATALOG } from "@/lib/control/jobs-catalog";
import { useT, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/control/jobs")({
  component: JobsPage,
});

const STATUS_KEYS: Record<(typeof CONTROL_JOBS_CATALOG)[number]["status"], TKey> = {
  manual: "control.jobs.status.manual",
  trigger: "control.jobs.status.trigger",
  deferred: "control.jobs.status.deferred",
};

function JobsPage() {
  const { t } = useT();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <ListTodo className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.jobs")}
          </p>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{t("control.jobs.title")}</h1>
        <p className="text-sm text-stone-400">{t("control.jobs.subtitle")}</p>
      </header>

      <ul className="overflow-hidden rounded-xl border border-border-subtle">
        {CONTROL_JOBS_CATALOG.map((job) => (
          <li
            key={job.id}
            className="flex flex-wrap items-center gap-3 border-b border-border-subtle/60 px-3 py-2.5 last:border-0"
          >
            <div className="min-w-0 flex-1">
              <p className="font-mono text-sm font-semibold text-white">{job.id}</p>
              <p className="text-xs text-stone-400">{t(job.descKey as TKey)}</p>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
              {t(STATUS_KEYS[job.status])}
            </span>
            {job.href && (
              <a href={job.href} className="text-xs font-semibold text-accent">
                {t("control.jobs.open")}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
