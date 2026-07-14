import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, AuthField } from "@/components/auth-shell";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password — Nexus" },
      { name: "description", content: "Reset your Nexus password." },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const { resetPassword, configured } = useAuth();
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      toast.success(t("auth.forgot.mockSent"), {
        description: t("auth.forgot.sentHint"),
      });
      return;
    }

    setBusy(true);
    const result = await resetPassword(email.trim());
    setBusy(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(t("auth.forgot.sent"), {
      description: t("auth.forgot.sentHint"),
    });
  };

  return (
    <AuthShell
      title={t("auth.forgot.title")}
      subtitle={t("auth.forgot.subtitle")}
      footer={
        <>
          {t("auth.forgot.footer")}{" "}
          <Link to="/login" className="font-semibold text-accent hover:underline">
            {t("auth.forgot.back")}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {!configured && (
          <p className="rounded-lg border border-border-subtle bg-white/[0.03] px-3 py-2 text-[11px] text-stone-500">
            {t("auth.demoBannerShort")}
          </p>
        )}
        <AuthField
          label={t("auth.email")}
          type="email"
          name="email"
          placeholder="you@nexus.gg"
          value={email}
          onChange={setEmail}
          required
          autoComplete="email"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-accent py-3 font-display text-sm font-bold uppercase tracking-widest text-accent-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? t("auth.forgot.busy") : t("auth.forgot.submit")}
        </button>
      </form>
    </AuthShell>
  );
}
