import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, AuthField } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { checkAuthCooldown, markAuthCooldown } from "@/lib/rate-limit";
import { useT, translateStatic } from "@/lib/i18n";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: translateStatic("meta.page.register") },
      { name: "description", content: "Create your Nexus account and find your squad." },
    ],
  }),
  component: RegisterPage,
});

type Step = 0 | 1 | 2;

function RegisterPage() {
  const navigate = useNavigate();
  const { signUp, configured } = useAuth();
  const { t } = useT();
  const [step, setStep] = useState<Step>(0);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [tag, setTag] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [busy, setBusy] = useState(false);

  const stepLabels = [
    t("auth.register.stepAccount"),
    t("auth.register.stepIdentity"),
    t("auth.register.stepLegal"),
  ] as const;

  const goNext = () => {
    if (step === 0) {
      setStep(1);
      return;
    }
    if (step === 1) {
      setStep(2);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) {
      goNext();
      return;
    }

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
      navigate({ to: "/", search: {} });
      return;
    }

    const cool = checkAuthCooldown("register", 30);
    if (!cool.ok) {
      toast.error(t("auth.cooldown", { n: String(cool.retryInSec) }));
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
    markAuthCooldown("register");

    toast.success(result.session ? t("auth.register.success") : t("auth.register.confirmEmail"));
    if (result.session) navigate({ to: "/", search: {} });
    else navigate({ to: "/login" });
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
      <form onSubmit={onSubmit} className="space-y-5">
        {!configured && <p className="nx-caption text-center">{t("auth.demoBanner")}</p>}

        <p className="nx-caption text-center" aria-live="polite">
          {stepLabels[step]} · {step + 1}/3
        </p>

        {step === 0 && (
          <>
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
              placeholder={t("auth.register.passwordHint")}
              value={password}
              onChange={setPassword}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </>
        )}

        {step === 1 && (
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
        )}

        {step === 2 && (
          <>
            <AuthField
              label={t("auth.register.dob")}
              type="date"
              name="dob"
              value={dob}
              onChange={setDob}
              required
            />
            <label className="flex items-start gap-3 text-sm text-stone-400">
              <input type="checkbox" className="mt-1 size-4 shrink-0 accent-[color:var(--accent)]" required />
              <span>
                {t("auth.register.agreeBefore")}{" "}
                <Link to="/terms" className="text-accent hover:underline">
                  {t("auth.register.terms")}
                </Link>
                {t("auth.register.comma")}{" "}
                <Link to="/privacy" className="text-accent hover:underline">
                  {t("auth.register.privacy")}
                </Link>{" "}
                {t("auth.register.and")}{" "}
                <Link to="/guidelines" className="text-accent hover:underline">
                  {t("auth.register.guidelines")}
                </Link>
                .
              </span>
            </label>
          </>
        )}

        <div className="flex gap-2">
          {step > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="touch"
              className="flex-1 border border-border-subtle"
              onClick={() => setStep((s) => (s - 1) as Step)}
            >
              {t("common.back")}
            </Button>
          ) : null}
          <Button type="submit" variant="accent" size="touch" disabled={busy} className="flex-1">
            {step < 2
              ? t("auth.register.next")
              : busy
                ? t("auth.register.busy")
                : t("auth.register.submit")}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
