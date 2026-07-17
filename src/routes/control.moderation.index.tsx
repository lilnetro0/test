import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import {
  listModerationQueue,
  setModerationReportStatus,
  type ControlReportRow,
} from "@/lib/control/api";
import { useT, type TKey } from "@/lib/i18n";
import { scanArabicAssistSignals } from "@/lib/moderation/arabic-assist";

type QueueSearch = { status?: string };

export const Route = createFileRoute("/control/moderation/")({
  validateSearch: (s: Record<string, unknown>): QueueSearch => ({
    status: typeof s.status === "string" ? s.status : undefined,
  }),
  component: ModerationQueuePage,
});

const FILTERS = ["open", "reviewing", "resolved", "dismissed", "all"] as const;

function ModerationQueuePage() {
  const { t, lang } = useT();
  const { accessToken } = useAuth();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const status = search.status ?? "open";
  const [reports, setReports] = useState<ControlReportRow[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    const r = await listModerationQueue({
      data: { accessToken, status, limit: 50 },
    });
    setLoading(false);
    if (!r.ok) {
      setError(r.error);
      setReports([]);
      return;
    }
    setReports(r.reports);
    setOpenCount(r.openCount);
  }, [accessToken, status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const claim = async (id: string) => {
    if (!accessToken) return;
    const res = await setModerationReportStatus({
      data: { accessToken, reportId: id, status: "reviewing" },
    });
    if (!res.ok) toast.error(res.error);
    else {
      toast.success(t("control.mod.claimed"));
      void refresh();
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-4 md:p-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <Flag className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.group.work")}
          </p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">{t("control.mod.title")}</h1>
            <p className="text-sm text-stone-400">{t("control.mod.subtitle")}</p>
          </div>
          <p className="rounded-lg bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent">
            {t("control.mod.openCount", { n: String(openCount) })}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => void navigate({ search: { status: s === "open" ? undefined : s } })}
            className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
              status === s
                ? "bg-accent/20 text-accent"
                : "bg-white/5 text-stone-400 hover:text-white"
            }`}
          >
            {t(`control.mod.filter.${s}` as TKey)}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading && <p className="text-sm text-stone-500">{t("control.checking")}</p>}

      {!loading && reports.length === 0 && (
        <p className="rounded-xl border border-dashed border-border-subtle p-8 text-center text-sm text-stone-500">
          {t("control.mod.empty")}
        </p>
      )}

      <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle">
        {reports.map((r) => {
          const signals = scanArabicAssistSignals(r.details);
          return (
            <li key={r.id} className="space-y-2 bg-white/[0.02] p-4 hover:bg-white/[0.04]">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link
                  to="/control/moderation/$reportId"
                  params={{ reportId: r.id }}
                  className="text-sm font-bold text-white hover:text-accent"
                >
                  {r.reason}{" "}
                  <span className="ms-2 text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    {r.status}
                  </span>
                </Link>
                <span className="text-[10px] uppercase tracking-widest text-stone-500">
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </div>
              <p className="line-clamp-2 text-xs text-stone-400" dir="auto">
                {r.details || t("control.mod.noDetails")}
              </p>
              {signals.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                  {signals.map((s) => (
                    <li
                      key={s.id}
                      className="rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200"
                    >
                      {lang === "ar" ? s.labelAr : s.labelEn}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-[11px] text-stone-500">
                {r.reporter_username ? `${r.reporter_username}#${r.reporter_tag}` : "—"}
                {" → "}
                {r.target_username ? `${r.target_username}#${r.target_tag}` : "—"}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/control/moderation/$reportId"
                  params={{ reportId: r.id }}
                  className="rounded-md bg-accent/15 px-2 py-1 text-[10px] font-bold uppercase text-accent"
                >
                  {t("control.mod.open")}
                </Link>
                {r.status === "open" && (
                  <button
                    type="button"
                    className="rounded-md bg-white/5 px-2 py-1 text-[10px] font-bold uppercase text-stone-300"
                    onClick={() => void claim(r.id)}
                  >
                    {t("control.mod.claim")}
                  </button>
                )}
                {r.target_user_id && (
                  <Link
                    to="/control/users/$userId"
                    params={{ userId: r.target_user_id }}
                    className="rounded-md bg-white/5 px-2 py-1 text-[10px] font-bold uppercase text-stone-300"
                  >
                    {t("control.mod.openUser")}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
