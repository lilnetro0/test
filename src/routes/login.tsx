import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, AuthField } from "@/components/auth-shell";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { checkAuthCooldown, markAuthCooldown } from "@/lib/rate-limit";
import { useT, translateStatic } from "@/lib/i18n";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: translateStatic("meta.page.login") },
      { name: "description", content: "Log in to your Nexus account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signInOAuth, configured } = useAuth();
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      toast.success(t("auth.login.mockSuccess"), {
        description: t("auth.login.mockHint"),
      });
      navigate({ to: "/", search: {} });
      return;
    }

    const cool = checkAuthCooldown("login", 3);
    if (!cool.ok) {
      toast.error(t("auth.cooldown", { n: String(cool.retryInSec) }));
      return;
    }

    setBusy(true);
    const result = await signIn(email.trim(), password);
    setBusy(false);
    markAuthCooldown("login");

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(t("auth.login.success"));
    navigate({ to: "/", search: {} });
  };

  return (
    <AuthShell
      title={t("auth.login.title")}
      subtitle={t("auth.login.subtitle")}
      footer={
        <>
          {t("auth.login.footer")}{" "}
          <Link to="/register" className="font-semibold text-accent hover:underline">
            {t("auth.login.create")}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {!configured && (
          <p className="rounded-lg border border-border-subtle bg-white/[0.03] px-3 py-2 text-[11px] text-stone-500">
            {t("auth.demoBanner")}
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
        <AuthField
          label={t("auth.password")}
          type="password"
          name="password"
          placeholder="••••••••"
          value={password}
          onChange={setPassword}
          required
          autoComplete="current-password"
          hint={<Link to="/forgot-password">{t("auth.login.forgot")}</Link>}
        />
        <label className="flex items-center gap-2 text-xs text-stone-400">
          <input type="checkbox" className="accent-[color:var(--accent)]" defaultChecked />
          {t("auth.login.keepSignedIn")}
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-accent py-3 font-display text-sm font-bold uppercase tracking-widest text-accent-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? t("auth.login.busy") : t("auth.login.submit")}
        </button>
        <div className="flex items-center gap-3 py-2">
          <div className="h-px flex-1 bg-border-subtle" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-600">
            {t("auth.login.orContinue")}
          </span>
          <div className="h-px flex-1 bg-border-subtle" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { label: "Discord", provider: "discord" as const },
              { label: "Google", provider: "google" as const },
              { label: "Steam", provider: null },
            ] as const
          ).map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                if (!p.provider) {
                  toast(t("auth.oauthSoon", { provider: p.label }));
                  return;
                }
                if (!configured) {
                  toast(t("auth.oauthSoon", { provider: p.label }));
                  return;
                }
                void signInOAuth(p.provider).then((r) => {
                  if (!r.ok) toast.error(r.error);
                });
              }}
              className="rounded-lg border border-border-subtle bg-background py-2.5 text-xs font-semibold text-stone-300 transition-colors hover:border-accent/40 hover:text-white"
            >
              {p.label}
            </button>
          ))}
        </div>
      </form>
    </AuthShell>
  );
}
