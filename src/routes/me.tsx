import { createFileRoute } from "@tanstack/react-router";
import { AppNav } from "@/components/app-nav";
import { AppShell } from "@/components/app-shell";
import { Field, FieldInput, FieldTextarea, ScreenHeader } from "@/components/ui-native";
import { Button } from "@/components/ui/button";
import { GAMES, ME, type HubCard } from "@/lib/mock-data";
import { useEffect, useRef, useState } from "react";
import { Camera, Gamepad2, Pencil, Trophy, Shield } from "lucide-react";
import { toast } from "sonner";
import { useT, translateStatic } from "@/lib/i18n";
import { getProfile, setProfile, type ProfileDraft } from "@/lib/prefs";
import { useAuth } from "@/lib/auth-provider";
import { uploadAvatar, AVATAR_ACCEPT } from "@/lib/supabase/storage";
import { fetchUserHubs } from "@/lib/chat/api";
import { shouldUseMockData } from "@/lib/supabase/env";
import { GameIcon } from "@/components/game-icon";
import { resolveIconUrl } from "@/lib/game-artwork";

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: translateStatic("meta.page.me") },
      { name: "description", content: "Edit your Nexus profile." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MePage,
});

type FormState = {
  username: string;
  tag: string;
  displayName: string;
  bio: string;
  /** Custom activity line → profiles.status_text */
  status: string;
  /** Presence enum → profiles.status */
  presence: "online" | "idle" | "dnd" | "offline";
};

const MOCK_DEFAULT: ProfileDraft = {
  displayName: ME.name,
  bio: "Gaming on Nexus (demo profile).",
  status: "Available",
};

function MePage() {
  const { t } = useT();
  const { configured, profile, user, updateProfile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [hubs, setHubs] = useState<HubCard[]>(() => GAMES);
  const [form, setForm] = useState<FormState>({
    username: "You",
    tag: "0420",
    displayName: ME.name,
    bio: ME.bio,
    status: MOCK_DEFAULT.status,
    presence: "online",
  });

  useEffect(() => {
    if (configured && profile) {
      const presence = (["online", "idle", "dnd", "offline"] as const).includes(
        profile.status as FormState["presence"],
      )
        ? (profile.status as FormState["presence"])
        : "online";
      setForm({
        username: profile.username,
        tag: profile.tag,
        displayName: profile.display_name || profile.username,
        bio: profile.bio,
        status: profile.status_text || "",
        presence,
      });
      return;
    }
    const local = getProfile(MOCK_DEFAULT);
    setForm((f) => ({
      ...f,
      displayName: local.displayName,
      bio: local.bio,
      status: local.status,
      username: ME.name,
      tag: ME.tag.replace("#", ""),
      presence: "online",
    }));
  }, [configured, profile]);

  useEffect(() => {
    if (shouldUseMockData() || !user?.id) {
      setHubs(GAMES);
      return;
    }
    let cancelled = false;
    void fetchUserHubs(user.id).then(({ hubs: next, error }) => {
      if (cancelled) return;
      if (error) toast.error(error);
      setHubs(next.length ? next : []);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const save = async () => {
    if (!configured) {
      setProfile({
        displayName: form.displayName,
        bio: form.bio,
        status: form.status,
      });
      setEditing(false);
      toast.success(t("me.saved"));
      return;
    }

    setBusy(true);
    const result = await updateProfile({
      username: form.username.trim(),
      tag: form.tag.trim(),
      display_name: form.displayName.trim(),
      bio: form.bio,
      status_text: form.status,
      status: form.presence,
    });
    setBusy(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    await refreshProfile();
    setEditing(false);
    toast.success(t("me.saved"));
  };

  const cancel = () => {
    if (configured && profile) {
      setForm({
        username: profile.username,
        tag: profile.tag,
        displayName: profile.display_name || profile.username,
        bio: profile.bio,
        status: profile.status_text || "",
        presence: (["online", "idle", "dnd", "offline"] as const).includes(
          profile.status as FormState["presence"],
        )
          ? (profile.status as FormState["presence"])
          : "online",
      });
    }
    setEditing(false);
  };

  const initials = (form.displayName || form.username || "?").slice(0, 2).toUpperCase();
  const tagLabel = `#${form.tag.replace(/^#/, "")}`;

  return (
    <AppShell>
      <main className="min-h-0 flex-1 overflow-y-auto">
        <ScreenHeader
          className="sticky top-0 z-10 bg-background/95"
          title={t("me.title")}
          trailing={
            !editing ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="size-3.5" />
                {t("me.edit")}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button type="button" variant="quiet" size="sm" onClick={cancel}>
                  {t("me.cancel")}
                </Button>
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  disabled={busy}
                  onClick={() => void save()}
                >
                  {busy ? "…" : t("me.save")}
                </Button>
              </div>
            )
          }
        />

        <div className="relative h-36 overflow-hidden border-b border-border-subtle/70 md:h-44">
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,color-mix(in_oklab,var(--accent)_22%,transparent),transparent_55%),linear-gradient(160deg,color-mix(in_oklab,var(--accent)_10%,transparent),transparent_50%),linear-gradient(to_bottom,oklch(0.2_0.01_260),var(--background))]"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="mx-auto max-w-3xl px-4 pb-16 md:px-6">
          <div className="-mt-14 flex flex-col gap-5 sm:flex-row sm:items-end md:-mt-16">
            <div className="relative shrink-0 self-start">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="size-28 rounded-[1.35rem] border-[3px] border-background object-cover shadow-[var(--nx-shadow-2)] md:size-32"
                />
              ) : (
                <div className="grid size-28 place-items-center rounded-[1.35rem] border-[3px] border-background bg-gradient-to-br from-accent/25 to-surface-mid font-display text-2xl font-semibold text-accent shadow-[var(--nx-shadow-2)] md:size-32 md:text-3xl">
                  {initials}
                </div>
              )}
              {configured && user && (
                <>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept={AVATAR_ACCEPT}
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      setUploadingAvatar(true);
                      const up = await uploadAvatar(user.id, file);
                      if (up.error || !up.url) {
                        toast.error(up.error ?? t("me.uploadFailed"));
                        setUploadingAvatar(false);
                        return;
                      }
                      const result = await updateProfile({ avatar_url: up.url });
                      setUploadingAvatar(false);
                      if (!result.ok) toast.error(result.error);
                      else {
                        await refreshProfile();
                        toast.success(t("me.saved"));
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                    className="nx-touch absolute -bottom-1 -end-1 grid place-items-center rounded-full border border-border-subtle bg-surface-mid text-accent shadow-[var(--nx-shadow-1)] hover:bg-white/10 disabled:opacity-50"
                    aria-label={t("me.uploadAvatar")}
                  >
                    <Camera className="size-3.5" />
                  </button>
                </>
              )}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              {editing ? (
                <div className="space-y-3">
                  <FieldInput
                    label={t("me.displayName")}
                    value={form.displayName}
                    onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                  />
                  {configured && (
                    <div className="grid grid-cols-3 gap-2">
                      <FieldInput
                        className="col-span-2"
                        label={t("auth.username")}
                        value={form.username}
                        onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                      />
                      <FieldInput
                        label={t("me.tag")}
                        value={form.tag}
                        maxLength={4}
                        onChange={(e) => setForm((p) => ({ ...p, tag: e.target.value }))}
                        className="font-mono"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <h2 className="nx-display text-[1.85rem] md:text-[2.15rem]">{form.displayName}</h2>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle/80 bg-white/[0.03] px-2.5 py-1 shadow-[var(--nx-shadow-1)]">
                      <span
                        className={`size-1.5 rounded-full ${
                          form.presence === "offline"
                            ? "bg-stone-500"
                            : form.presence === "dnd"
                              ? "bg-danger"
                              : form.presence === "idle"
                                ? "bg-amber-400"
                                : "bg-online"
                        }`}
                      />
                      <span className="nx-caption text-stone-300">
                        {form.status || t("you.online")}
                      </span>
                    </span>
                    <span className="nx-caption font-mono text-stone-500">
                      {form.username}
                      {tagLabel}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <section className="mt-10 space-y-3">
            <h3 className="nx-section">{t("me.about")}</h3>
            {editing ? (
              <div className="space-y-4">
                <Field label={t("me.presence")} hint={form.presence === "dnd" ? t("me.presenceDndHint") : undefined}>
                  <select
                    value={form.presence}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        presence: e.target.value as FormState["presence"],
                      }))
                    }
                    className="flex min-h-11 w-full rounded-lg border border-border-subtle bg-white/[0.03] px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-1 focus-visible:ring-accent"
                  >
                    <option value="online">{t("me.presenceOnline")}</option>
                    <option value="idle">{t("me.presenceIdle")}</option>
                    <option value="dnd">{t("me.presenceDnd")}</option>
                    <option value="offline">{t("me.presenceOffline")}</option>
                  </select>
                </Field>
                <FieldInput
                  label={t("me.status")}
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                />
                <FieldTextarea
                  label={t("me.bio")}
                  value={form.bio}
                  rows={3}
                  onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                />
              </div>
            ) : (
              <p className="nx-body max-w-prose text-pretty">{form.bio || "—"}</p>
            )}
          </section>

          {!configured ? (
            <div className="mt-8 grid grid-cols-3 gap-2">
              <Stat icon={Trophy} label={t("me.statWins")} value="—" hint={t("me.demoStat")} />
              <Stat icon={Shield} label={t("me.statRank")} value="—" hint={t("me.demoStat")} />
              <Stat
                icon={Gamepad2}
                label={t("me.statHubs")}
                value={String(GAMES.length)}
                hint={t("me.demoStat")}
              />
            </div>
          ) : null}

          <section className="mt-10">
            <h3 className="nx-section mb-4">{t("me.games")}</h3>
            {hubs.length === 0 ? (
              <p className="nx-body">{t("me.noHubs")}</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {hubs.map((g) => (
                  <AppNav
                    key={g.id}
                    to="/c/$hubSlug"
                    params={{ hubSlug: g.id }}
                    className="nx-press group flex flex-col items-center gap-2 rounded-2xl border border-border-subtle/70 p-4 shadow-[var(--nx-shadow-1)] transition-colors hover:border-accent/30"
                  >
                    <GameIcon
                      src={resolveIconUrl({ coverUrl: g.imageUrl, iconUrl: g.iconUrl })}
                      short={g.short}
                      tint={g.tint}
                      textTint={g.textTint}
                      size="lg"
                    />
                    <span className="nx-caption text-center text-stone-300">{g.name}</span>
                  </AppNav>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </AppShell>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border-subtle/60 bg-white/[0.02] px-3 py-3 shadow-[var(--nx-shadow-1)]">
      <Icon className="size-3.5 text-accent/80" strokeWidth={1.75} />
      <p className="mt-2 font-display text-base font-medium text-white/90">{value}</p>
      <p className="nx-caption mt-0.5">{label}</p>
      {hint ? <p className="nx-caption mt-1 opacity-70">{hint}</p> : null}
    </div>
  );
}
