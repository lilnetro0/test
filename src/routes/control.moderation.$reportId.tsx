import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import {
  controlBanUser,
  getModerationReport,
  setModerationReportStatus,
  type ControlReportRow,
} from "@/lib/control/api";
import { useT } from "@/lib/i18n";
import { MOD_RESPONSE_TEMPLATES, scanArabicAssistSignals } from "@/lib/moderation/arabic-assist";

export const Route = createFileRoute("/control/moderation/$reportId")({
  component: ReportDetailPage,
});

function ReportDetailPage() {
  const { t, lang } = useT();
  const { accessToken } = useAuth();
  const { reportId } = Route.useParams();
  const [report, setReport] = useState<ControlReportRow | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    const r = await getModerationReport({ data: { accessToken, reportId } });
    setLoading(false);
    if (!r.ok) {
      setError(r.error);
      setReport(null);
      return;
    }
    setReport(r.report);
    setNote(r.report.resolution_note ?? "");
    setError(null);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on id/token
  }, [accessToken, reportId]);

  const setStatus = async (status: "open" | "reviewing" | "resolved" | "dismissed") => {
    if (!accessToken) return;
    setBusy(true);
    const res = await setModerationReportStatus({
      data: { accessToken, reportId, status, resolutionNote: note },
    });
    setBusy(false);
    if (!res.ok) toast.error(res.error);
    else {
      toast.success(t("control.mod.statusUpdated"));
      void load();
    }
  };

  const banTarget = async () => {
    if (!accessToken || !report?.target_user_id) return;
    setBusy(true);
    const res = await controlBanUser({
      data: {
        accessToken,
        targetUserId: report.target_user_id,
        ban: true,
        reason: `Report: ${report.reason}`,
        reportId: report.id,
      },
    });
    setBusy(false);
    if (!res.ok) toast.error(res.error);
    else toast.success(t("control.mod.banned"));
  };

  if (loading) {
    return <div className="p-8 text-sm text-stone-500">{t("control.checking")}</div>;
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 p-8">
        <Link to="/control/moderation" className="text-xs font-semibold text-accent">
          ← {t("control.mod.back")}
        </Link>
        <p className="text-sm text-red-300">{error ?? t("control.mod.notFound")}</p>
      </div>
    );
  }

  const signals = scanArabicAssistSignals(report.details);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4 md:p-8">
      <Link to="/control/moderation" className="text-xs font-semibold text-accent">
        ← {t("control.mod.back")}
      </Link>

      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <Flag className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.mod.detailEyebrow")}
          </p>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{report.reason}</h1>
        <p className="text-xs uppercase tracking-widest text-stone-500">
          {report.status} · {new Date(report.created_at).toLocaleString()}
        </p>
      </header>

      <section className="space-y-3 rounded-xl border border-border-subtle p-4">
        <p className="text-sm text-stone-300" dir="auto">
          {report.details || t("control.mod.noDetails")}
        </p>
        {signals.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {signals.map((s) => (
              <li
                key={s.id}
                className="rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200"
                title={s.sample}
              >
                {lang === "ar" ? s.labelAr : s.labelEn}
              </li>
            ))}
          </ul>
        )}
        <dl className="grid gap-2 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-stone-500">{t("control.mod.reporter")}</dt>
            <dd className="text-white">
              {report.reporter_username
                ? `${report.reporter_username}#${report.reporter_tag}`
                : report.reporter_id.slice(0, 8)}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">{t("control.mod.target")}</dt>
            <dd className="text-white">
              {report.target_user_id ? (
                <Link
                  to="/control/users/$userId"
                  params={{ userId: report.target_user_id }}
                  className="text-accent hover:underline"
                >
                  {report.target_username
                    ? `${report.target_username}#${report.target_tag}`
                    : report.target_user_id.slice(0, 8)}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          {report.message_id && (
            <div>
              <dt className="text-stone-500">{t("control.mod.message")}</dt>
              <dd className="font-mono text-stone-300">{report.message_id}</dd>
            </div>
          )}
          {report.dm_message_id && (
            <div>
              <dt className="text-stone-500">{t("control.mod.dm")}</dt>
              <dd className="font-mono text-stone-300">{report.dm_message_id}</dd>
            </div>
          )}
          {report.voice_channel_id && (
            <div>
              <dt className="text-stone-500">{t("control.mod.voice")}</dt>
              <dd className="font-mono text-stone-300">{report.voice_channel_id}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="space-y-3 rounded-xl border border-border-subtle p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
          {t("control.mod.actions")}
        </h2>
        <select
          className="w-full rounded-lg border border-border-subtle bg-white/5 px-3 py-2 text-sm text-white"
          defaultValue=""
          onChange={(e) => {
            const tpl = MOD_RESPONSE_TEMPLATES.find((x) => x.id === e.target.value);
            if (!tpl) return;
            setNote(lang === "ar" ? tpl.ar : tpl.en);
            e.target.value = "";
          }}
        >
          <option value="">{t("control.mod.template")}</option>
          {MOD_RESPONSE_TEMPLATES.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>
              {(lang === "ar" ? tpl.ar : tpl.en).slice(0, 56)}…
            </option>
          ))}
        </select>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 500))}
          rows={3}
          dir="auto"
          placeholder={t("control.mod.notePlaceholder")}
          className="w-full rounded-lg border border-border-subtle bg-white/5 px-3 py-2 text-sm text-white"
        />
        <div className="flex flex-wrap gap-2">
          {report.status === "open" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void setStatus("reviewing")}
              className="rounded-md bg-accent/15 px-3 py-1.5 text-[10px] font-bold uppercase text-accent disabled:opacity-50"
            >
              {t("control.mod.claim")}
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => void setStatus("resolved")}
            className="rounded-md bg-emerald-500/15 px-3 py-1.5 text-[10px] font-bold uppercase text-emerald-300 disabled:opacity-50"
          >
            {t("control.mod.resolve")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void setStatus("dismissed")}
            className="rounded-md bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase text-stone-300 disabled:opacity-50"
          >
            {t("control.mod.dismiss")}
          </button>
          {report.target_user_id && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void banTarget()}
              className="rounded-md bg-red-500/15 px-3 py-1.5 text-[10px] font-bold uppercase text-red-300 disabled:opacity-50"
            >
              {t("control.mod.ban")}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
