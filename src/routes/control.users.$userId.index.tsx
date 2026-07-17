import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import { controlBanUser, getControlUser, type ControlUserDetail } from "@/lib/control/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/users/$userId/")({
  component: UserOverviewPage,
});

function UserOverviewPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const { userId } = Route.useParams();
  const [user, setUser] = useState<ControlUserDetail | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!accessToken) return;
    const r = await getControlUser({ data: { accessToken, userId } });
    if (r.ok) {
      setUser(r.user);
      setReason(r.user.ban_reason ?? "");
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, userId]);

  const toggleBan = async (ban: boolean) => {
    if (!accessToken || !user) return;
    setBusy(true);
    const res = await controlBanUser({
      data: {
        accessToken,
        targetUserId: user.id,
        ban,
        reason: reason || undefined,
      },
    });
    setBusy(false);
    if (!res.ok) toast.error(res.error);
    else {
      toast.success(ban ? t("control.user.banDone") : t("control.user.unbanDone"));
      void load();
    }
  };

  if (!user) {
    return <p className="text-sm text-stone-500">{t("control.checking")}</p>;
  }

  return (
    <div className="space-y-4">
      <dl className="grid gap-3 rounded-xl border border-border-subtle p-4 text-sm sm:grid-cols-2">
        <Field label={t("control.user.displayName")} value={user.display_name || "—"} />
        <Field
          label={t("control.user.status")}
          value={`${user.status} · ${user.status_text || "—"}`}
        />
        <Field
          label={t("control.user.created")}
          value={new Date(user.created_at).toLocaleString()}
        />
        <Field
          label={t("control.user.lastSeen")}
          value={user.last_seen_at ? new Date(user.last_seen_at).toLocaleString() : "—"}
        />
        <Field label={t("control.user.memberships")} value={String(user.membership_count)} />
        <Field label={t("control.user.openReports")} value={String(user.open_reports_against)} />
        <div className="sm:col-span-2">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
            {t("control.user.bio")}
          </dt>
          <dd className="mt-0.5 text-stone-300" dir="auto">
            {user.bio || "—"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">ID</dt>
          <dd className="mt-0.5 font-mono text-xs text-stone-400">{user.id}</dd>
        </div>
      </dl>

      <section className="space-y-3 rounded-xl border border-border-subtle p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
          {t("control.user.enforce")}
        </h2>
        {user.banned_at && (
          <p className="text-sm text-red-300">
            {t("control.user.bannedSince", {
              when: new Date(user.banned_at).toLocaleString(),
            })}
            {user.ban_reason ? ` — ${user.ban_reason}` : ""}
          </p>
        )}
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, 500))}
          placeholder={t("control.user.banReason")}
          dir="auto"
          className="w-full rounded-lg border border-border-subtle bg-white/5 px-3 py-2 text-sm text-white"
        />
        <div className="flex flex-wrap gap-2">
          {!user.banned_at ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void toggleBan(true)}
              className="rounded-md bg-red-500/15 px-3 py-1.5 text-[10px] font-bold uppercase text-red-300 disabled:opacity-50"
            >
              {t("control.user.ban")}
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void toggleBan(false)}
              className="rounded-md bg-emerald-500/15 px-3 py-1.5 text-[10px] font-bold uppercase text-emerald-300 disabled:opacity-50"
            >
              {t("control.user.unban")}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">{label}</dt>
      <dd className="mt-0.5 text-white">{value}</dd>
    </div>
  );
}
