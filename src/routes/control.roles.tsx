import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import {
  adminGrantPlatformRole,
  adminListPlatformAdmins,
  adminRevokePlatformRole,
} from "@/lib/admin/api";
import { CONTROL_PERMISSIONS } from "@/lib/control/permissions";
import { CONTROL_ROLE_FAMILIES } from "@/lib/control/role-matrix";
import { useT, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/control/roles")({
  component: RolesPage,
});

type AdminRow = {
  user_id: string;
  username: string;
  tag: string;
  created_at: string;
};

function RolesPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [targetId, setTargetId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!accessToken) return;
    const r = await adminListPlatformAdmins({ data: { accessToken } });
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setError(null);
    setAdmins(r.admins);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const grant = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken || !targetId.trim()) return;
    setBusy(true);
    const r = await adminGrantPlatformRole({
      data: { accessToken, targetUserId: targetId.trim() },
    });
    setBusy(false);
    if (!r.ok) toast.error(r.error);
    else {
      toast.success(t("control.roles.granted"));
      setTargetId("");
      void load();
    }
  };

  const revoke = async (userId: string) => {
    if (!accessToken) return;
    if (!window.confirm(t("control.roles.revokeConfirm"))) return;
    setBusy(true);
    const r = await adminRevokePlatformRole({ data: { accessToken, targetUserId: userId } });
    setBusy(false);
    if (!r.ok) toast.error(r.error);
    else {
      toast.success(t("control.roles.revoked"));
      void load();
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <Shield className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.roles")}
          </p>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{t("control.roles.title")}</h1>
        <p className="text-sm text-stone-400">{t("control.roles.subtitle")}</p>
      </header>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white">{t("control.roles.admins")}</h2>
        <form onSubmit={grant} className="flex flex-wrap gap-2">
          <input
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder={t("control.roles.userIdPlaceholder")}
            className="min-w-0 flex-1 rounded-lg border border-border-subtle bg-white/5 px-3 py-2 font-mono text-sm text-white"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-accent/20 px-4 py-2 text-xs font-semibold text-accent disabled:opacity-50"
          >
            {t("control.roles.grant")}
          </button>
        </form>
        <ul className="overflow-hidden rounded-xl border border-border-subtle">
          {admins.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-stone-500">{t("control.roles.empty")}</li>
          ) : (
            admins.map((a) => (
              <li
                key={a.user_id}
                className="flex flex-wrap items-center gap-3 border-b border-border-subtle/60 px-3 py-2.5 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    to="/control/users/$userId"
                    params={{ userId: a.user_id }}
                    className="font-semibold text-white hover:text-accent"
                  >
                    {a.username}
                    <span className="text-stone-500">#{a.tag}</span>
                  </Link>
                  <p className="font-mono text-[10px] text-stone-500">{a.user_id}</p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void revoke(a.user_id)}
                  className="text-xs font-semibold text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  {t("control.roles.revoke")}
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-white">{t("control.roles.matrix")}</h2>
        <p className="text-xs text-stone-500">{t("control.roles.matrixNote")}</p>
        <div className="overflow-x-auto rounded-xl border border-border-subtle">
          <table className="w-full min-w-[40rem] text-xs">
            <thead className="bg-white/[0.03] text-[10px] uppercase tracking-widest text-stone-500">
              <tr>
                <th className="px-2 py-2 text-start font-semibold">{t("control.roles.family")}</th>
                <th className="px-2 py-2 text-start font-semibold">{t("control.roles.grants")}</th>
              </tr>
            </thead>
            <tbody>
              {CONTROL_ROLE_FAMILIES.map((f) => (
                <tr key={f.id} className="border-t border-border-subtle/60 align-top">
                  <td className="px-2 py-2 font-semibold text-white">
                    {t(f.labelKey as TKey)}
                  </td>
                  <td className="px-2 py-2 font-mono text-[10px] leading-relaxed text-stone-400">
                    {f.permissions.join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="columns-1 gap-x-6 sm:columns-2">
          {CONTROL_PERMISSIONS.map((p) => (
            <li key={p} className="break-inside-avoid py-0.5 font-mono text-xs text-stone-500">
              {p}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
