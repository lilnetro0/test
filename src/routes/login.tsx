import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, AuthField } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
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
      <form onSubmit={onSubmit} className="space-y-5">
        {!configured && <p className="nx-caption text-center">{t("auth.demoBanner")}</p>}
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
        <label className="flex min-h-11 items-center gap-2 text-sm text-stone-400">
          <input type="checkbox" className="size-4 accent-[color:var(--accent)]" defaultChecked />
          {t("auth.login.keepSignedIn")}
        </label>
        <Button type="submit" variant="accent" size="touch" disabled={busy} className="w-full">
          {busy ? t("auth.login.busy") : t("auth.login.submit")}
        </Button>
        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-border-subtle" />
          <span className="nx-caption">{t("auth.login.orContinue")}</span>
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
            <Button
              key={p.label}
              type="button"
              variant="ghost"
              size="touch"
              className="border border-border-subtle text-stone-400"
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
            >
              {p.label}
            </Button>
          ))}
        </div>
      </form>
    </AuthShell>
  );
}
