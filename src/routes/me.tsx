import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
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
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border-subtle bg-background/80 px-4 backdrop-blur-md">
          <h1 className="font-display text-sm font-bold uppercase tracking-tight text-white">
            {t("me.title")}
          </h1>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 rounded-lg border border-border-subtle bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-stone-200 hover:bg-white/10"
            >
              <Pencil className="size-3.5" />
              {t("me.edit")}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={cancel}
                className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-semibold text-stone-400 hover:text-white"
              >
                {t("me.cancel")}
              </button>
              <button
                onClick={() => void save()}
                disabled={busy}
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-accent-foreground hover:brightness-110 disabled:opacity-60"
              >
                {busy ? "…" : t("me.save")}
              </button>
            </div>
          )}
        </header>

        <div className="relative h-36 border-b border-border-subtle bg-gradient-to-br from-accent/25 via-transparent to-transparent md:h-48" />

        <div className="mx-auto max-w-3xl px-4 pb-16 md:px-6">
          <div className="-mt-12 flex items-end gap-4 md:-mt-14">
            <div className="relative">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="size-24 rounded-2xl border-4 border-background object-cover shadow-xl md:size-28"
                />
              ) : (
                <div className="grid size-24 place-items-center rounded-2xl border-4 border-background bg-accent/20 font-display text-2xl font-bold text-accent shadow-xl md:size-28">
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
                        toast.error(up.error ?? "Upload failed");
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
                    className="absolute -bottom-1 -end-1 grid size-8 place-items-center rounded-full border border-border-subtle bg-surface-mid text-accent shadow hover:bg-white/10 disabled:opacity-50"
                    aria-label="Upload avatar"
                  >
                    <Camera className="size-3.5" />
                  </button>
                </>
              )}
            </div>
            <div className="min-w-0 flex-1 pb-2">
              {editing ? (
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      {t("me.displayName")}
                    </span>
                    <input
                      value={form.displayName}
                      onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-mid px-3 py-2 text-sm font-bold text-white outline-none focus:border-accent/50"
                    />
                  </label>
                  {configured && (
                    <div className="grid grid-cols-3 gap-2">
                      <label className="col-span-2 block">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                          Username
                        </span>
                        <input
                          value={form.username}
                          onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-mid px-3 py-2 text-sm text-white outline-none focus:border-accent/50"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                          {t("me.tag")}
                        </span>
                        <input
                          value={form.tag}
                          onChange={(e) => setForm((p) => ({ ...p, tag: e.target.value }))}
                          maxLength={4}
                          className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-mid px-3 py-2 font-mono text-sm text-white outline-none focus:border-accent/50"
                        />
                      </label>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white md:text-3xl">
                    {form.displayName}
                  </h2>
                  <p className="mt-1 text-xs text-stone-400">
                    <span className="text-online">●</span>{" "}
                    {form.status || t("you.online")} · {form.username}
                    {tagLabel}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-border-subtle bg-surface-mid p-5">
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-500">
              {t("me.about")}
            </h3>
            {editing ? (
              <div className="space-y-4">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    {t("me.presence")}
                  </span>
                  <select
                    value={form.presence}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        presence: e.target.value as FormState["presence"],
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-white outline-none focus:border-accent/50"
                  >
                    <option value="online">{t("me.presenceOnline")}</option>
                    <option value="idle">{t("me.presenceIdle")}</option>
                    <option value="dnd">{t("me.presenceDnd")}</option>
                    <option value="offline">{t("me.presenceOffline")}</option>
                  </select>
                  {form.presence === "dnd" ? (
                    <p className="mt-1 text-[11px] text-stone-500">{t("me.presenceDndHint")}</p>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    {t("me.status")}
                  </span>
                  <input
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-white outline-none focus:border-accent/50"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    {t("me.bio")}
                  </span>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                    rows={3}
                    className="mt-1 w-full resize-none rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-white outline-none focus:border-accent/50"
                  />
                </label>
              </div>
            ) : (
              <p className="text-sm text-stone-300">{form.bio || "—"}</p>
            )}
          </div>

          {!configured ? (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Stat icon={Trophy} label="Wins" value="—" hint={t("me.demoStat")} />
              <Stat icon={Shield} label="Rank" value="—" hint={t("me.demoStat")} />
              <Stat icon={Gamepad2} label="Hubs" value={String(GAMES.length)} hint={t("me.demoStat")} />
            </div>
          ) : null}

          <div className="mt-8">
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-stone-500">
              {t("me.games")}
            </h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {hubs.length === 0 ? (
                <p className="col-span-full text-sm text-stone-500">{t("me.noHubs")}</p>
              ) : (
                hubs.map((g) => (
                  <Link
                    key={g.id}
                    to="/"
                    search={{ hub: g.id }}
                    className={`group flex flex-col items-center gap-2 rounded-xl border border-border-subtle p-4 transition-all hover:border-accent/40 ${g.tint}`}
                  >
                    <span className={`font-display text-sm font-bold ${g.textTint}`}>{g.short}</span>
                    <span className="text-[11px] font-semibold text-stone-200">{g.name}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
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
    <div className="rounded-xl border border-border-subtle bg-surface-mid p-4">
      <Icon className="size-4 text-accent" />
      <p className="mt-2 font-display text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">{label}</p>
      {hint ? (
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-amber-200/80">{hint}</p>
      ) : null}
    </div>
  );
}
