import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, AuthField } from "@/components/auth-shell";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — Nexus" },
      { name: "description", content: "Create your Nexus account and find your squad." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { signUp, configured } = useAuth();
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [tag, setTag] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dob) {
      const birth = new Date(dob);
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 13);
      if (Number.isNaN(birth.getTime()) || birth > cutoff) {
        toast.error(t("auth.register.ageError"));
        return;
      }
    }
    if (!isSupabaseConfigured()) {
      toast.success(t("auth.register.mockSuccess"), {
        description: t("auth.register.mockHint"),
      });
      navigate({ to: "/" });
      return;
    }

    setBusy(true);
    const result = await signUp({
      email: email.trim(),
      password,
      username: username.trim(),
      tag: tag.trim(),
    });
    setBusy(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.session ? t("auth.register.success") : t("auth.register.confirmEmail"));
    navigate({ to: result.session ? "/" : "/login" });
  };

  return (
    <AuthShell
      title={t("auth.register.title")}
      subtitle={t("auth.register.subtitle")}
      footer={
        <>
          {t("auth.register.footer")}{" "}
          <Link to="/login" className="font-semibold text-accent hover:underline">
            {t("auth.register.login")}
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
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <AuthField
              label={t("auth.username")}
              name="username"
              placeholder="GhostProtocol"
              value={username}
              onChange={setUsername}
              required
              autoComplete="username"
            />
          </div>
          <AuthField
            label={t("auth.tag")}
            name="tag"
            placeholder="0001"
            value={tag}
            onChange={setTag}
            autoComplete="off"
          />
        </div>
        <AuthField
          label={t("auth.password")}
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
          label={t("auth.register.dob")}
          type="date"
          name="dob"
          value={dob}
          onChange={setDob}
          required
        />

        <label className="flex items-start gap-2 text-xs text-stone-400">
          <input type="checkbox" className="mt-0.5 accent-[color:var(--accent)]" required />
          <span>
            {t("auth.register.agreeBefore")}{" "}
            <Link to="/terms" className="text-accent hover:underline">
              {t("auth.register.terms")}
            </Link>{" "}
            {t("auth.register.and")}{" "}
            <Link to="/privacy" className="text-accent hover:underline">
              {t("auth.register.privacy")}
            </Link>
            .
          </span>
        </label>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-accent py-3 font-display text-sm font-bold uppercase tracking-widest text-accent-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? t("auth.register.busy") : t("auth.register.submit")}
        </button>
      </form>
    </AuthShell>
  );
}
