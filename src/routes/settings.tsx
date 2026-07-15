import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useEffect, useState } from "react";
import { GAMES, type HubCard } from "@/lib/mock-data";
import { toast } from "sonner";
import { useT, LANG_LABELS, type Lang, type TKey } from "@/lib/i18n";
import {
  User,
  Palette,
  Volume2,
  Bell,
  Keyboard,
  Globe,
  LogOut,
  Shield,
  CreditCard,
} from "lucide-react";
import {
  applyAppearanceClasses,
  getHighContrast,
  getHubNotifs,
  getReduceMotion,
  setHighContrast,
  setHubNotif,
  setReduceMotion,
  type HubNotifMode,
} from "@/lib/prefs";
import { useAuth } from "@/lib/auth-provider";
import { shouldUseMockData } from "@/lib/supabase/env";
import { fetchLiveHubs, fetchUserHubs } from "@/lib/chat/api";
import { getVoiceHealth } from "@/lib/voice/create-voice-token";
import { deleteMyAccount, exportMyData } from "@/lib/account/api";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Nexus" },
      {
        name: "description",
        content: "Manage your Nexus account, appearance, voice, notifications, and more.",
      },
    ],
  }),
  component: SettingsPage,
});

const SECTION_META = [
  { id: "account", labelKey: "settings.section.account" as TKey, icon: User },
  { id: "privacy", labelKey: "settings.section.privacy" as TKey, icon: Shield },
  { id: "billing", labelKey: "settings.section.billing" as TKey, icon: CreditCard },
  { id: "appearance", labelKey: "settings.section.appearance" as TKey, icon: Palette },
  { id: "voice", labelKey: "settings.section.voice" as TKey, icon: Volume2 },
  { id: "notifications", labelKey: "settings.section.notifications" as TKey, icon: Bell },
  { id: "keybinds", labelKey: "settings.section.keybinds" as TKey, icon: Keyboard },
  { id: "language", labelKey: "settings.section.language" as TKey, icon: Globe },
] as const;

type SectionId = (typeof SECTION_META)[number]["id"];

function SettingsPage() {
  const [section, setSection] = useState<SectionId>("account");
  const navigate = useNavigate();
  const { t } = useT();
  const { configured, signOut } = useAuth();

  useEffect(() => {
    applyAppearanceClasses();
  }, []);

  const logout = async () => {
    if (configured) {
      const result = await signOut();
      if (!result.ok) toast.error(result.error);
    }
    navigate({ to: "/login" });
  };

  return (
    <AppShell>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden w-64 shrink-0 flex-col border-e border-border-subtle bg-surface-mid md:flex">
          <header className="flex h-16 items-center border-b border-border-subtle px-5">
            <h1 className="font-display text-base font-bold uppercase tracking-tight text-white">
              {t("settings.title")}
            </h1>
          </header>
          <div className="flex-1 overflow-y-auto p-3">
            <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-stone-500">
              {t("settings.group.user")}
            </div>
            {SECTION_META.slice(0, 3).map((s) => (
              <SectionButton
                key={s.id}
                label={t(s.labelKey)}
                icon={s.icon}
                active={section === s.id}
                onClick={() => setSection(s.id)}
              />
            ))}
            <div className="mb-2 mt-4 px-3 text-[10px] font-bold uppercase tracking-widest text-stone-500">
              {t("settings.group.app")}
            </div>
            {SECTION_META.slice(3).map((s) => (
              <SectionButton
                key={s.id}
                label={t(s.labelKey)}
                icon={s.icon}
                active={section === s.id}
                onClick={() => setSection(s.id)}
              />
            ))}
            <div className="my-3 h-px bg-border-subtle" />
            <button
              onClick={() => void logout()}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/10"
            >
              <LogOut className="size-4" />
              {t("settings.logout")}
            </button>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="sticky top-0 z-10 border-b border-border-subtle bg-surface-mid/95 backdrop-blur-md md:hidden">
            <div className="flex h-12 items-center px-4">
              <h1 className="font-display text-sm font-bold uppercase tracking-tight text-white">
                {t("settings.title")}
              </h1>
            </div>
            <div className="flex gap-2 overflow-x-auto px-3 pb-2 no-scrollbar">
              {SECTION_META.map((s) => {
                const Icon = s.icon;
                const active = section === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSection(s.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border-subtle text-stone-400 hover:text-white"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    {t(s.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mx-auto w-full max-w-2xl px-4 py-5 pb-8 md:px-6 md:py-10">
            {section === "account" && <AccountSection />}
            {section === "privacy" && <PrivacySection />}
            {section === "billing" && <BillingSection />}
            {section === "appearance" && <AppearanceSection />}
            {section === "voice" && <VoiceSection />}
            {section === "notifications" && <NotificationsSection />}
            {section === "keybinds" && <KeybindsSection />}
            {section === "language" && <LanguageSection />}
          </div>
        </main>
      </div>
    </AppShell>
  );
}

function SectionButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: typeof User;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        active ? "bg-white/5 font-medium text-white" : "text-stone-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className={`size-4 ${active ? "text-accent" : "text-stone-500"}`} />
      {label}
    </button>
  );
}

function SettingsHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white">{title}</h2>
      {sub && <p className="mt-1 text-sm text-stone-400">{sub}</p>}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-xl border border-border-subtle bg-surface-mid p-5">{children}</div>
  );
}

function Row({
  label,
  desc,
  action,
}: {
  label: string;
  desc?: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{label}</p>
        {desc && <p className="mt-0.5 text-xs text-stone-500">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

function Toggle({
  on,
  onChange,
  defaultOn = false,
  soon = false,
}: {
  on?: boolean;
  onChange?: (v: boolean) => void;
  defaultOn?: boolean;
  /** Non-functional preview control */
  soon?: boolean;
}) {
  const { t } = useT();
  const [internal, setInternal] = useState(defaultOn);
  const value = soon ? false : (on ?? internal);
  const set = (v: boolean) => {
    if (soon) {
      toast(t("common.comingSoon"));
      return;
    }
    if (onChange) onChange(v);
    else setInternal(v);
  };
  return (
    <span className="flex items-center gap-2">
      {soon ? (
        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-600">
          {t("common.soon")}
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => set(!value)}
        title={soon ? t("common.comingSoon") : undefined}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          value ? "bg-accent" : "bg-stone-700"
        } ${soon ? "cursor-not-allowed opacity-50" : ""}`}
        aria-pressed={value}
        aria-disabled={soon || undefined}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${
            value
              ? "ltr:translate-x-[22px] rtl:-translate-x-[22px]"
              : "ltr:translate-x-0.5 rtl:-translate-x-0.5"
          }`}
        />
      </button>
    </span>
  );
}

function AccountSection() {
  const { t } = useT();
  const navigate = useNavigate();
  const { profile, user, configured, accessToken, resetPassword } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const name = profile?.display_name || profile?.username || "You";
  const tag = profile?.tag ? `#${profile.tag}` : "#0420";
  const bio = profile?.bio || "";
  const email = user?.email || (configured ? "—" : "you@nexus.gg");

  useEffect(() => {
    if (!accessToken) {
      setIsAdmin(false);
      return;
    }
    void import("@/lib/admin/api").then(({ checkIsAdmin }) =>
      checkIsAdmin({ data: { accessToken } }).then((r) => setIsAdmin(r.admin)),
    );
  }, [accessToken]);

  return (
    <>
      <SettingsHeader title={t("settings.section.account")} />
      {isAdmin && (
        <Card>
          <Row
            label="Admin moderation"
            desc="Ban / unban players"
            action={
              <button
                type="button"
                onClick={() => navigate({ to: "/admin" })}
                className="text-xs font-semibold text-accent"
              >
                Open
              </button>
            }
          />
        </Card>
      )}
      <Card>
        <div className="flex items-center gap-4">
          <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-accent/15 font-display text-lg font-bold text-accent">
            {name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-white">
              {name}
              <span className="ms-1 font-mono text-xs text-stone-500">{tag}</span>
            </p>
            <p className="text-xs text-stone-400">{bio || "—"}</p>
          </div>
          <button
            onClick={() => navigate({ to: "/me" })}
            className="rounded-md bg-accent/10 px-3 py-2 text-xs font-semibold text-accent"
          >
            {t("settings.editProfile")}
          </button>
        </div>
      </Card>
      <Card>
        <Row label={t("settings.email")} desc={email} action={<span className="text-[10px] text-stone-600">via Auth</span>} />
        <div className="h-px bg-border-subtle" />
        <Row
          label={t("settings.password")}
          desc={t("settings.passwordDesc")}
          action={
            <button
              className="text-xs font-semibold text-accent"
              onClick={async () => {
                if (!configured || !user?.email) {
                  navigate({ to: "/forgot-password" });
                  return;
                }
                const result = await resetPassword(user.email);
                if (!result.ok) toast.error(result.error);
                else toast.success("Reset email sent");
              }}
            >
              {t("settings.change")}
            </button>
          }
        />
        <div className="h-px bg-border-subtle" />
        <Row label={t("settings.2fa")} desc={t("settings.2faDesc")} action={<Toggle soon />} />
      </Card>
      <SessionSecurityCard />
      <LinkedAccountsCard />
      <AccountDataCard />
    </>
  );
}

function SessionSecurityCard() {
  const { t } = useT();
  const { configured } = useAuth();
  const [busy, setBusy] = useState(false);

  return (
    <Card>
      <Row
        label={t("account.sessions")}
        desc={t("account.sessionsDesc")}
        action={
          <button
            type="button"
            disabled={!configured || busy}
            className="text-xs font-semibold text-accent disabled:opacity-50"
            onClick={async () => {
              if (!configured) {
                toast.error(t("account.needLogin"));
                return;
              }
              setBusy(true);
              try {
                const { signOutOtherSessions } = await import("@/lib/supabase/auth");
                const res = await signOutOtherSessions();
                if (!res.ok) toast.error(res.error);
                else toast.success(t("account.sessionsDone"));
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? t("account.sessionsBusy") : t("account.sessionsAction")}
          </button>
        }
      />
    </Card>
  );
}

function LinkedAccountsCard() {
  const { t } = useT();
  const { configured } = useAuth();
  const [identities, setIdentities] = useState<
    Array<{ identityId: string; provider: string; email?: string }>
  >([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = async () => {
    if (!configured) {
      setIdentities([]);
      return;
    }
    const { listLinkedIdentities } = await import("@/lib/supabase/auth");
    const res = await listLinkedIdentities();
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setIdentities(
      res.identities.filter((i) => i.provider === "google" || i.provider === "discord"),
    );
  };

  useEffect(() => {
    void refresh();
  }, [configured]);

  if (!configured) return null;

  return (
    <Card>
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-stone-500">
        {t("account.linkedTitle")}
      </p>
      {identities.length === 0 ? (
        <p className="text-xs text-stone-500">{t("account.linkedEmpty")}</p>
      ) : (
        <ul className="space-y-2">
          {identities.map((id) => (
            <li
              key={id.identityId}
              className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold capitalize text-white">{id.provider}</p>
                {id.email ? <p className="truncate text-[11px] text-stone-500">{id.email}</p> : null}
              </div>
              <button
                type="button"
                disabled={busyId === id.identityId || identities.length < 2}
                title={identities.length < 2 ? t("account.unlinkLast") : undefined}
                className="shrink-0 text-xs font-semibold text-danger disabled:opacity-40"
                onClick={async () => {
                  setBusyId(id.identityId);
                  try {
                    const { unlinkOAuthIdentity } = await import("@/lib/supabase/auth");
                    const res = await unlinkOAuthIdentity(id.identityId);
                    if (!res.ok) toast.error(res.error);
                    else {
                      toast.success(t("account.unlinked"));
                      void refresh();
                    }
                  } finally {
                    setBusyId(null);
                  }
                }}
              >
                {busyId === id.identityId ? t("account.unlinkBusy") : t("account.unlink")}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[11px] text-stone-500">{t("account.linkedHint")}</p>
    </Card>
  );
}

function AccountDataCard() {
  const { t } = useT();
  const navigate = useNavigate();
  const { configured, accessToken, profile, signOut } = useAuth();
  const [busy, setBusy] = useState<"export" | "delete" | null>(null);
  const [confirmUser, setConfirmUser] = useState("");
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  const onExport = async () => {
    if (!configured || !accessToken) {
      toast.error(t("account.needLogin"));
      return;
    }
    setBusy("export");
    try {
      const res = await exportMyData({ data: { accessToken } });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const blob = new Blob([res.payloadJson], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nexus-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("account.exportDone"));
    } finally {
      setBusy(null);
    }
  };

  const onDelete = async () => {
    if (!configured || !accessToken) {
      toast.error(t("account.needLogin"));
      return;
    }
    setBusy("delete");
    try {
      const res = await deleteMyAccount({
        data: {
          accessToken,
          confirmUsername: confirmUser,
          confirmPhrase,
        },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      await signOut();
      toast.success(t("account.deleteDone"));
      navigate({ to: "/login" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Card>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-stone-500">
          {t("account.dataTitle")}
        </p>
        <Row
          label={t("account.export")}
          desc={t("account.exportDesc")}
          action={
            <button
              type="button"
              disabled={busy === "export"}
              onClick={() => void onExport()}
              className="text-xs font-semibold text-accent disabled:opacity-50"
            >
              {busy === "export" ? t("account.exportBusy") : t("account.exportAction")}
            </button>
          }
        />
      </Card>
      <Card>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-danger">
          {t("account.dangerTitle")}
        </p>
        <p className="mb-3 text-xs text-stone-400">{t("account.deleteDesc")}</p>
        {!showDelete ? (
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs font-bold uppercase tracking-wide text-danger hover:bg-danger/15"
          >
            {t("account.deleteAction")}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-stone-400">
              {t("account.deleteConfirmHint", {
                username: profile?.username ?? "username",
              })}
            </p>
            <input
              value={confirmUser}
              onChange={(e) => setConfirmUser(e.target.value)}
              placeholder={t("account.deleteConfirmUser")}
              className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-white outline-none focus:border-accent/50"
              autoComplete="off"
            />
            <input
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value)}
              placeholder={t("account.deleteConfirmPhrase")}
              className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-white outline-none focus:border-accent/50"
              autoComplete="off"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy === "delete"}
                onClick={() => void onDelete()}
                className="rounded-md bg-danger px-3 py-2 text-xs font-bold uppercase tracking-wide text-white hover:brightness-110 disabled:opacity-50"
              >
                {busy === "delete" ? t("account.deleteBusy") : t("account.deleteConfirm")}
              </button>
              <button
                type="button"
                disabled={busy === "delete"}
                onClick={() => {
                  setShowDelete(false);
                  setConfirmUser("");
                  setConfirmPhrase("");
                }}
                className="rounded-md px-3 py-2 text-xs font-semibold text-stone-400 hover:text-white"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}

function PrivacySection() {
  const { t } = useT();
  return (
    <>
      <SettingsHeader title={t("settings.section.privacy")} />
      <Card>
        <Row label={t("settings.privacy.dms")} desc={t("settings.privacy.dmsDesc")} action={<Toggle soon />} />
        <div className="h-px bg-border-subtle" />
        <Row
          label={t("settings.privacy.activity")}
          desc={t("settings.privacy.activityDesc")}
          action={<Toggle soon />}
        />
        <div className="h-px bg-border-subtle" />
        <Row
          label={t("settings.privacy.filter")}
          desc={t("settings.privacy.filterDesc")}
          action={<Toggle soon />}
        />
      </Card>
      <Card>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-stone-500">
          {t("legal.eyebrow")}
        </p>
        <div className="flex flex-wrap gap-3 text-xs font-semibold">
          <Link to="/terms" className="text-accent hover:underline">
            {t("legal.terms.title")}
          </Link>
          <Link to="/privacy" className="text-accent hover:underline">
            {t("legal.privacy.title")}
          </Link>
          <Link to="/guidelines" className="text-accent hover:underline">
            {t("legal.guidelines.title")}
          </Link>
          <Link to="/cookies" className="text-accent hover:underline">
            {t("legal.cookies.title")}
          </Link>
        </div>
      </Card>
    </>
  );
}

function BillingSection() {
  const { t } = useT();
  return (
    <>
      <SettingsHeader title={t("settings.section.billing")} sub={t("settings.billing.sub")} />
      <Card>
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <p className="text-lg font-bold text-white">{t("settings.billing.plan")}</p>
            <p className="text-xs text-stone-500">{t("settings.billing.current")}</p>
          </div>
          <button
            type="button"
            onClick={() => toast(t("common.comingSoon"))}
            className="rounded-md bg-accent/80 px-4 py-2 text-xs font-bold uppercase tracking-widest text-accent-foreground opacity-90"
          >
            {t("settings.billing.upgrade")} · {t("common.soon")}
          </button>
        </div>
      </Card>
    </>
  );
}

function AppearanceSection() {
  const { t } = useT();
  const { configured, prefs, savePrefs } = useAuth();
  const [reduceMotion, setRm] = useState(false);
  const [highContrast, setHc] = useState(false);

  useEffect(() => {
    if (prefs) {
      setRm(prefs.reduce_motion);
      setHc(prefs.high_contrast);
      return;
    }
    setRm(getReduceMotion());
    setHc(getHighContrast());
  }, [prefs]);

  const persistAppearance = async (next: { reduce_motion?: boolean; high_contrast?: boolean }) => {
    if (next.reduce_motion !== undefined) setReduceMotion(next.reduce_motion);
    if (next.high_contrast !== undefined) setHighContrast(next.high_contrast);
    if (!configured) return;
    const result = await savePrefs(next);
    if (!result.ok) toast.error(result.error);
  };

  return (
    <>
      <SettingsHeader title={t("settings.section.appearance")} />
      <Card>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-stone-500">
          {t("settings.appearance.theme")}
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            t("settings.appearance.cyber"),
            t("settings.appearance.midnight"),
            t("settings.appearance.system"),
          ].map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                if (i !== 0) toast(t("common.comingSoon"));
              }}
              className={`rounded-lg border p-3 text-start ${
                i === 0
                  ? "border-accent bg-accent/5"
                  : "border-border-subtle bg-surface-mid opacity-70 hover:border-accent/30"
              }`}
            >
              <div className="mb-2 h-16 rounded bg-background" />
              <p className="text-xs font-semibold text-white">
                {label}
                {i !== 0 ? (
                  <span className="ms-2 text-[10px] uppercase tracking-widest text-stone-600">
                    {t("common.soon")}
                  </span>
                ) : null}
              </p>
            </button>
          ))}
        </div>
      </Card>
      <Card>
        <Row
          label={t("settings.appearance.compact")}
          desc={t("settings.appearance.compactDesc")}
          action={<Toggle soon />}
        />
        <div className="h-px bg-border-subtle" />
        <Row
          label={t("settings.appearance.reduceMotion")}
          desc={t("settings.appearance.reduceMotionDesc")}
          action={
            <Toggle
              on={reduceMotion}
              onChange={(v) => {
                setRm(v);
                void persistAppearance({ reduce_motion: v });
              }}
            />
          }
        />
        <div className="h-px bg-border-subtle" />
        <Row
          label={t("settings.appearance.highContrast")}
          desc={t("settings.appearance.highContrastDesc")}
          action={
            <Toggle
              on={highContrast}
              onChange={(v) => {
                setHc(v);
                void persistAppearance({ high_contrast: v });
              }}
            />
          }
        />
        <div className="h-px bg-border-subtle" />
        <Row
          label={t("settings.appearance.whatsNew")}
          desc={t("settings.appearance.whatsNewDesc")}
          action={
            <button
              onClick={() => window.dispatchEvent(new Event("nexus:open-whats-new"))}
              className="text-xs font-semibold text-accent"
            >
              {t("settings.appearance.whatsNewCta")}
            </button>
          }
        />
      </Card>
    </>
  );
}

function VoiceSection() {
  const { t } = useT();
  const [voiceHealth, setVoiceHealth] = useState<{
    livekitConfigured: boolean;
    urlHost: string | null;
  } | null>(null);

  useEffect(() => {
    void getVoiceHealth().then(setVoiceHealth).catch(() => setVoiceHealth(null));
  }, []);

  const healthDesc =
    voiceHealth == null
      ? "…"
      : voiceHealth.livekitConfigured
        ? voiceHealth.urlHost
          ? t("voice.healthHost").replace("{host}", voiceHealth.urlHost)
          : t("voice.healthOk")
        : t("voice.healthOff");

  return (
    <>
      <SettingsHeader title={t("settings.section.voice")} sub={t("settings.voice.deviceSoon")} />
      <Card>
        <Row
          label={t("voice.healthLabel")}
          desc={healthDesc}
          action={
            <span
              className={`text-[10px] font-bold uppercase tracking-wide ${
                voiceHealth?.livekitConfigured ? "text-online" : "text-amber-200/90"
              }`}
            >
              {voiceHealth?.livekitConfigured ? "Live" : "Stub"}
            </span>
          }
        />
        <div className="h-px bg-border-subtle" />
        <Row
          label={t("settings.voice.input")}
          desc={t("common.comingSoon")}
          action={
            <select
              disabled
              className="rounded-md border border-border-subtle bg-background px-3 py-1.5 text-xs text-stone-500 opacity-70"
            >
              <option>{t("settings.voice.inputDefault")}</option>
            </select>
          }
        />
        <div className="h-px bg-border-subtle" />
        <Row
          label={t("settings.voice.sensitivity")}
          desc={t("common.comingSoon")}
          action={
            <input
              type="range"
              disabled
              defaultValue={60}
              className="w-40 accent-[color:var(--accent)] opacity-50"
            />
          }
        />
        <div className="h-px bg-border-subtle" />
        <Row label={t("settings.voice.ptt")} desc={t("settings.voice.pttDesc")} action={<Toggle soon />} />
        <div className="h-px bg-border-subtle" />
        <Row
          label={t("settings.voice.noise")}
          desc={t("settings.voice.noiseDesc")}
          action={<Toggle soon />}
        />
        <div className="h-px bg-border-subtle" />
        <Row label={t("settings.voice.echo")} action={<Toggle soon />} />
      </Card>
      <Card>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-stone-500">
          {t("settings.voice.video")}
        </p>
        <Row
          label={t("settings.voice.camera")}
          desc={t("common.comingSoon")}
          action={
            <select
              disabled
              className="rounded-md border border-border-subtle bg-background px-3 py-1.5 text-xs text-stone-500 opacity-70"
            >
              <option>{t("settings.voice.inputDefault")}</option>
            </select>
          }
        />
      </Card>
    </>
  );
}

function NotificationsSection() {
  const { t } = useT();
  const { configured, prefs, savePrefs, user, accessToken } = useAuth();
  const live = !shouldUseMockData();
  const [hubs, setHubs] = useState<HubCard[]>(() => GAMES);
  const [hubsLoading, setHubsLoading] = useState(false);
  const [modes, setModes] = useState<Record<string, HubNotifMode>>({});
  const [pushBusy, setPushBusy] = useState(false);
  const pushOn = Boolean(prefs?.push_enabled);

  useEffect(() => {
    if (prefs?.hub_notif_modes && typeof prefs.hub_notif_modes === "object") {
      setModes(prefs.hub_notif_modes as Record<string, HubNotifMode>);
      return;
    }
    setModes(getHubNotifs());
  }, [prefs]);

  useEffect(() => {
    if (!live) {
      setHubs(GAMES);
      return;
    }
    let cancelled = false;
    setHubsLoading(true);
    void (async () => {
      const result = user?.id
        ? await fetchUserHubs(user.id)
        : await fetchLiveHubs().then((r) => ({
            hubs: r.hubs.map((h) => h.game),
            error: r.error,
          }));
      if (cancelled) return;
      if (result.error) toast.error(result.error);
      setHubs(result.hubs);
      setHubsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [live, user?.id]);

  /** Keys are `hubs.slug` (same as dock / `/?hub=`). */
  const setMode = (hubSlug: string, mode: HubNotifMode) => {
    setHubNotif(hubSlug, mode);
    const next = { ...modes, [hubSlug]: mode };
    setModes(next);
    if (configured) {
      void savePrefs({ hub_notif_modes: next }).then((r) => {
        if (!r.ok) toast.error(r.error);
      });
    }
  };

  const setPushEnabled = async (next: boolean) => {
    if (!configured || !accessToken) {
      toast.error(t("account.needLogin"));
      return;
    }
    setPushBusy(true);
    try {
      const { enableBrowserPush, disableBrowserPush } = await import("@/lib/push/client");
      if (next) {
        const enabled = await enableBrowserPush(accessToken);
        if (!enabled.ok) {
          toast.error(enabled.error ?? "Could not enable push");
          return;
        }
      } else {
        const disabled = await disableBrowserPush(accessToken);
        if (!disabled.ok) {
          toast.error(disabled.error ?? "Could not disable push");
          return;
        }
      }
      const saved = await savePrefs({ push_enabled: next });
      if (!saved.ok) {
        toast.error(saved.error);
        return;
      }
      toast.success(next ? t("settings.notif.pushOn") : t("settings.notif.pushOff"));
    } finally {
      setPushBusy(false);
    }
  };

  return (
    <>
      <SettingsHeader title={t("settings.section.notifications")} />
      <Card>
        <Row
          label={t("settings.notif.desktop")}
          desc={t("settings.notif.desktopDesc")}
          action={
            <Toggle
              on={pushOn}
              onChange={(v) => {
                if (pushBusy) return;
                void setPushEnabled(v);
              }}
            />
          }
        />
        <div className="h-px bg-border-subtle" />
        <Row
          label={t("settings.notif.sound")}
          action={
            <Toggle
              on={prefs?.notif_sound !== false}
              onChange={(v) => {
                if (!configured) {
                  toast.error(t("account.needLogin"));
                  return;
                }
                void savePrefs({ notif_sound: v }).then((r) => {
                  if (!r.ok) toast.error(r.error);
                });
              }}
            />
          }
        />
        <div className="h-px bg-border-subtle" />
        <Row
          label={t("settings.notif.mentions")}
          desc={t("settings.notif.mentionsDesc")}
          action={
            <Toggle
              on={Boolean(prefs?.notif_mentions_only)}
              onChange={(v) => {
                if (!configured) {
                  toast.error(t("account.needLogin"));
                  return;
                }
                void savePrefs({ notif_mentions_only: v }).then((r) => {
                  if (!r.ok) toast.error(r.error);
                });
              }}
            />
          }
        />
        <div className="h-px bg-border-subtle" />
        <Row
          label={t("settings.notif.dnd")}
          desc={t("settings.notif.dndDesc")}
          action={
            <Toggle
              on={Boolean(prefs?.notif_match_dnd)}
              onChange={(v) => {
                if (!configured) {
                  toast.error(t("account.needLogin"));
                  return;
                }
                void savePrefs({ notif_match_dnd: v }).then((r) => {
                  if (!r.ok) toast.error(r.error);
                });
              }}
            />
          }
        />
      </Card>
      <Card>
        <p className="mb-1 text-sm font-semibold text-white">{t("settings.notif.perHub")}</p>
        <p className="mb-4 text-xs text-stone-500">{t("settings.notif.perHubDesc")}</p>
        {hubsLoading ? (
          <p className="text-xs text-stone-500">Loading hubs…</p>
        ) : hubs.length === 0 ? (
          <p className="text-xs text-stone-500">
            {user ? "Join a hub to configure per-hub notifications." : "Sign in to manage hub notifications."}
          </p>
        ) : (
          <div className="space-y-3">
            {hubs.map((g) => {
              const mode = modes[g.id] ?? "all";
              return (
                <div key={g.id} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-lg font-display text-[10px] font-bold ${g.tint} ${g.textTint}`}
                    >
                      {g.short}
                    </span>
                    <span className="truncate text-sm text-stone-200">{g.hubName}</span>
                  </div>
                  <div className="flex shrink-0 gap-1 rounded-lg border border-border-subtle p-0.5">
                    {(
                      [
                        ["all", t("settings.notif.hubAll")],
                        ["mentions", t("settings.notif.hubMentions")],
                        ["mute", t("settings.notif.hubMute")],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        onClick={() => setMode(g.id, id)}
                        className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                          mode === id ? "bg-accent/15 text-accent" : "text-stone-500 hover:text-white"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}

function KeybindsSection() {
  const { t } = useT();
  const binds = [
    { label: t("settings.keybinds.mute"), key: "Ctrl + Shift + M" },
    { label: t("settings.keybinds.deafen"), key: "Ctrl + Shift + D" },
    { label: t("settings.keybinds.ptt"), key: "Right Alt" },
    { label: t("settings.keybinds.overlay"), key: "Shift + `" },
    { label: t("settings.keybinds.quick"), key: "Ctrl + K" },
  ];
  return (
    <>
      <SettingsHeader title={t("settings.section.keybinds")} sub={t("settings.keybinds.note")} />
      <Card>
        {binds.map((b, i) => (
          <div key={b.label}>
            <Row
              label={b.label}
              action={
                <kbd className="rounded border border-border-subtle bg-background px-2 py-1 font-mono text-[11px] text-stone-300">
                  {b.key}
                </kbd>
              }
            />
            {i < binds.length - 1 && <div className="h-px bg-border-subtle" />}
          </div>
        ))}
      </Card>
    </>
  );
}

function LanguageSection() {
  const { lang, setLang, t } = useT();
  const { configured, savePrefs } = useAuth();
  return (
    <>
      <SettingsHeader title={t("settings.language.title")} />
      <Card>
        <Row
          label={t("settings.language.row")}
          action={
            <select
              value={lang}
              onChange={(e) => {
                const next = e.target.value as Lang;
                setLang(next);
                if (configured) {
                  void savePrefs({ lang: next }).then((r) => {
                    if (!r.ok) toast.error(r.error);
                  });
                }
              }}
              className="rounded-md border border-border-subtle bg-background px-3 py-1.5 text-xs text-white"
            >
              {(Object.keys(LANG_LABELS) as Lang[]).map((code) => (
                <option key={code} value={code}>
                  {LANG_LABELS[code].native} ({LANG_LABELS[code].label})
                </option>
              ))}
            </select>
          }
        />
      </Card>
      <p className="mt-3 px-1 text-xs text-stone-500">{t("settings.language.rtlNote")}</p>
    </>
  );
}
