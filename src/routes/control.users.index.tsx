import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import { controlSearch, listBannedUsers } from "@/lib/control/api";
import { adminLookupUser } from "@/lib/admin/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/users/")({
  component: ControlUsersPage,
});

function ControlUsersPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");
  const [banned, setBanned] = useState<
    Array<{
      id: string;
      username: string;
      tag: string;
      banned_at: string | null;
      ban_reason: string | null;
    }>
  >([]);
  const [recent, setRecent] = useState<
    Array<{ id: string; username: string; tag: string; banned_at: string | null }>
  >([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    void listBannedUsers({ data: { accessToken } }).then((r) => {
      if (r.ok) setBanned(r.users);
    });
  }, [accessToken]);

  const lookup = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    const q = draft.trim();
    if (!q) return;
    setBusy(true);

    const tagMatch = q.match(/^([A-Za-z0-9_\u0600-\u06FF]{2,32})#(\d{4})$/u);
    if (tagMatch) {
      const r = await adminLookupUser({
        data: { accessToken, usernameTag: `${tagMatch[1]}#${tagMatch[2]}` },
      });
      setBusy(false);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      if (!r.profile) {
        toast.error(t("control.user.notFound"));
        return;
      }
      void navigate({ to: "/control/users/$userId", params: { userId: r.profile.id } });
      return;
    }

    if (/^[0-9a-f-]{36}$/i.test(q)) {
      setBusy(false);
      void navigate({ to: "/control/users/$userId", params: { userId: q } });
      return;
    }

    const r = await controlSearch({ data: { accessToken, q, limit: 12 } });
    setBusy(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    setRecent(r.users);
    if (r.users.length === 1) {
      void navigate({ to: "/control/users/$userId", params: { userId: r.users[0].id } });
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <Users className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.group.work")}
          </p>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{t("control.user.dirTitle")}</h1>
        <p className="text-sm text-stone-400">{t("control.user.dirSubtitle")}</p>
      </header>

      <form onSubmit={(e) => void lookup(e)} className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("control.user.lookupPlaceholder")}
          className="min-w-0 flex-1 rounded-lg border border-border-subtle bg-white/5 px-3 py-2.5 text-sm text-white"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-accent/20 px-4 py-2.5 text-xs font-semibold text-accent disabled:opacity-50"
        >
          {t("control.user.lookup")}
        </button>
      </form>

      {recent.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-border-subtle">
          <h2 className="border-b border-border-subtle bg-white/[0.03] px-3 py-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
            {t("control.user.searchResults")}
          </h2>
          <ul>
            {recent.map((u) => (
              <li key={u.id} className="border-b border-border-subtle/60 last:border-0">
                <Link
                  to="/control/users/$userId"
                  params={{ userId: u.id }}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.03]"
                >
                  <span className="font-semibold text-white">
                    {u.username}
                    <span className="text-stone-500">#{u.tag}</span>
                  </span>
                  {u.banned_at && (
                    <span className="text-[10px] font-semibold uppercase text-red-400">
                      {t("control.user.banned")}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="overflow-hidden rounded-xl border border-border-subtle">
        <h2 className="border-b border-border-subtle bg-white/[0.03] px-3 py-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
          {t("control.user.bannedList")}
        </h2>
        {banned.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-stone-500">
            {t("control.user.noBanned")}
          </p>
        ) : (
          <ul>
            {banned.map((u) => (
              <li key={u.id} className="border-b border-border-subtle/60 last:border-0">
                <Link
                  to="/control/users/$userId"
                  params={{ userId: u.id }}
                  className="flex flex-col gap-0.5 px-3 py-2.5 hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-semibold text-white">
                    {u.username}
                    <span className="text-stone-500">#{u.tag}</span>
                  </span>
                  <span className="text-xs text-stone-500">
                    {u.banned_at ? new Date(u.banned_at).toLocaleString() : ""}
                    {u.ban_reason ? ` · ${u.ban_reason}` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
