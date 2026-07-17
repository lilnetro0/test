import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-provider";
import { listControlAnnouncements, type ControlAnnouncementRow } from "@/lib/control/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/announcements/")({
  component: AnnouncementsListPage,
});

function AnnouncementsListPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<ControlAnnouncementRow[]>([]);
  const [migrated, setMigrated] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void listControlAnnouncements({ data: { accessToken } }).then((r) => {
      if (cancelled) return;
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setError(null);
      setMigrated(r.migrated);
      setRows(r.rows);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <div className="space-y-3">
      {!migrated && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {t("control.ann.needMigration")}
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      <Link to="/control/announcements/new" className="inline-block text-xs font-semibold text-accent">
        {t("control.ann.create")} →
      </Link>
      <ul className="overflow-hidden rounded-xl border border-border-subtle">
        {rows.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-stone-500">{t("control.ann.empty")}</li>
        ) : (
          rows.map((r) => (
            <li key={r.id} className="border-b border-border-subtle/60 px-3 py-2.5 last:border-0">
              <p className="font-semibold text-white" dir="auto">
                {r.title}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-stone-400" dir="auto">
                {r.body}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-stone-500">
                {r.status} · {r.locale}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
