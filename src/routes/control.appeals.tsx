import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Scale } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import { decideBasicAppeal, listBasicAppeals, type ControlAppealRow } from "@/lib/control/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/appeals")({
  component: AppealsPage,
});

/**
 * Basic appeals (P1): banned accounts are the review queue until a dedicated
 * appeals table exists. Overturn = unban; Uphold = keep ban + audit note.
 */
function AppealsPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const [appeals, setAppeals] = useState<ControlAppealRow[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    const r = await listBasicAppeals({ data: { accessToken } });
    setLoading(false);
    if (!r.ok) {
      setError(r.error);
      setAppeals([]);
      return;
    }
    setAppeals(r.appeals);
    setError(null);
  }, [accessToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const decide = async (userId: string, decision: "uphold" | "overturn") => {
    if (!accessToken) return;
    const res = await decideBasicAppeal({
      data: {
        accessToken,
        userId,
        decision,
        note: notes[userId],
      },
    });
    if (!res.ok) toast.error(res.error);
    else {
      toast.success(
        decision === "overturn" ? t("control.appeals.overturned") : t("control.appeals.upheld"),
      );
      void refresh();
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <Scale className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.group.work")}
          </p>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{t("control.appeals.title")}</h1>
        <p className="text-sm text-stone-400">{t("control.appeals.subtitle")}</p>
      </header>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      {loading && <p className="text-sm text-stone-500">{t("control.checking")}</p>}
      {!loading && appeals.length === 0 && (
        <p className="rounded-xl border border-dashed border-border-subtle p-8 text-center text-sm text-stone-500">
          {t("control.appeals.empty")}
        </p>
      )}

      <ul className="space-y-3">
        {appeals.map((a) => (
          <li key={a.user_id} className="space-y-3 rounded-xl border border-border-subtle p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link
                  to="/control/users/$userId"
                  params={{ userId: a.user_id }}
                  className="font-semibold text-white hover:text-accent"
                >
                  {a.username}
                  <span className="text-stone-500">#{a.tag}</span>
                </Link>
                <p className="text-xs text-stone-500">
                  {t("control.appeals.bannedAt", {
                    when: new Date(a.banned_at).toLocaleString(),
                  })}
                </p>
              </div>
            </div>
            <p className="text-sm text-stone-300" dir="auto">
              {a.ban_reason || t("control.appeals.noReason")}
            </p>
            <input
              value={notes[a.user_id] ?? ""}
              onChange={(e) =>
                setNotes((prev) => ({ ...prev, [a.user_id]: e.target.value.slice(0, 500) }))
              }
              placeholder={t("control.appeals.notePlaceholder")}
              dir="auto"
              className="w-full rounded-lg border border-border-subtle bg-white/5 px-3 py-2 text-sm text-white"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void decide(a.user_id, "overturn")}
                className="rounded-md bg-emerald-500/15 px-3 py-1.5 text-[10px] font-bold uppercase text-emerald-300"
              >
                {t("control.appeals.overturn")}
              </button>
              <button
                type="button"
                onClick={() => void decide(a.user_id, "uphold")}
                className="rounded-md bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase text-stone-300"
              >
                {t("control.appeals.uphold")}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
