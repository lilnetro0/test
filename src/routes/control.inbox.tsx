import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import { listControlInbox, type ControlInboxItem } from "@/lib/control/api";
import { useT, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/control/inbox")({
  component: InboxPage,
});

const TITLE_KEYS: Record<ControlInboxItem["kind"], TKey> = {
  report_open: "control.inbox.kind.openReports",
  report_reviewing: "control.inbox.kind.reviewing",
  appeal: "control.inbox.kind.appeals",
  livekit: "control.inbox.kind.livekit",
  flag_maintenance: "control.inbox.kind.maintenance",
};

function InboxPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const [items, setItems] = useState<ControlInboxItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void listControlInbox({ data: { accessToken } }).then((r) => {
      if (cancelled) return;
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setError(null);
      setItems(r.items);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <Inbox className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.notifications")}
          </p>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{t("control.inbox.title")}</h1>
        <p className="text-sm text-stone-400">{t("control.inbox.subtitle")}</p>
      </header>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {items.length === 0 && !error ? (
        <p className="rounded-xl border border-dashed border-border-subtle p-6 text-center text-sm text-stone-400">
          {t("control.inbox.empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors",
                  item.severity === "high"
                    ? "border-red-500/40 bg-red-500/10 text-red-100"
                    : item.severity === "medium"
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-50"
                      : "border-border-subtle bg-white/[0.03] text-stone-200",
                )}
              >
                <span>
                  {t(TITLE_KEYS[item.kind], { n: String(item.count ?? 0) })}
                </span>
                <span className="text-xs font-semibold opacity-80">→</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      <Link to="/control/tasks" className="text-xs font-semibold text-stone-500 hover:text-accent">
        {t("control.nav.tasks")} →
      </Link>
    </div>
  );
}
