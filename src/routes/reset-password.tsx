import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthShell, AuthField } from "@/components/auth-shell";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useT, translateStatic } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: translateStatic("meta.page.reset") },
      { name: "description", content: "Set a new password for your Nexus account." },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const { changePassword, configured } = useAuth();
  const { t } = useT();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(!isSupabaseConfigured());

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;

    client.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    const { data: sub } = client.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error(t("auth.reset.mismatch"));
      return;
    }
    if (password.length < 8) {
      toast.error(t("auth.reset.tooShort"));
      return;
    }

    if (!isSupabaseConfigured()) {
      toast.success(t("auth.reset.mockSuccess"));
      navigate({ to: "/login" });
      return;
    }

    if (!ready) {
      toast.error(t("auth.reset.openLink"));
      return;
    }

    setBusy(true);
    const result = await changePassword(password);
    setBusy(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(t("auth.reset.success"));
    navigate({ to: "/login" });
  };

  return (
    <AuthShell
      title={t("auth.reset.title")}
      subtitle={t("auth.reset.subtitle")}
      footer={
        <Link to="/login" className="font-semibold text-accent hover:underline">
          {t("auth.reset.back")}
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {configured && !ready && (
          <p className="rounded-lg border border-border-subtle bg-white/[0.03] px-3 py-2 text-[11px] text-stone-500">
            {t("auth.reset.waiting")}
          </p>
        )}
        <AuthField
          label={t("auth.reset.newPassword")}
          type="password"
          name="password"
          placeholder={t("auth.register.passwordHint")}
          value={password}
          onChange={setPassword}
          required
          minLength={8}
          autoComplete="new-password"
        />
        <AuthField
          label={t("auth.reset.confirm")}
          type="password"
          name="confirm"
          placeholder={t("auth.reset.repeat")}
          value={confirm}
          onChange={setConfirm}
          required
          minLength={8}
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-accent py-3 font-display text-sm font-bold uppercase tracking-widest text-accent-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? t("auth.reset.busy") : t("auth.reset.submit")}
        </button>
      </form>
    </AuthShell>
  );
}
