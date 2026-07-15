import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { FRIENDS, GAMES, type HubCard } from "@/lib/mock-data";
import { ArrowLeft, MessageSquare, UserPlus, Gamepad2, Flag, Ban } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useT, translateStatic } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-provider";
import { shouldUseMockData } from "@/lib/supabase/env";
import {
  blockUser,
  fetchProfileByUsername,
  openDmWith,
  sendFriendRequestByTag,
  submitReport,
  type PublicProfile,
} from "@/lib/social/api";
import { fetchUserHubs } from "@/lib/chat/api";
import { ReportDialog, type ReportDialogTarget } from "@/components/report-dialog";

export const Route = createFileRoute("/profile/$username")({
  head: ({ params }) => ({
    meta: [
      {
        title: translateStatic("meta.page.profile", {
          username: decodeURIComponent(params.username),
        }),
      },
      {
        name: "description",
        content: `${decodeURIComponent(params.username)}'s Nexus profile — games, status, and shared hubs.`,
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const navigate = useNavigate();
  const { t } = useT();
  const { user } = useAuth();
  const live = !shouldUseMockData();
  const name = decodeURIComponent(username);

  const mockFriend = FRIENDS.find((f) => f.name.toLowerCase() === name.toLowerCase());
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [hubs, setHubs] = useState<HubCard[]>(() => (live ? [] : GAMES.slice(0, 4)));
  const [loading, setLoading] = useState(live);
  const [busy, setBusy] = useState<"dm" | "friend" | "block" | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportDialogTarget | null>(null);

  useEffect(() => {
    if (!live) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchProfileByUsername(name).then(async (p) => {
      if (cancelled) return;
      if (p.error) toast.error(p.error);
      setProfile(p.profile);
      if (p.profile) {
        const h = await fetchUserHubs(p.profile.id);
        if (!cancelled) {
          if (h.error) toast.error(h.error);
          setHubs(h.hubs.slice(0, 8));
        }
      } else {
        setHubs([]);
      }
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [live, name]);

  const displayName = live
    ? (profile?.displayName || profile?.username || name)
    : name;
  const tag = live
    ? profile
      ? `#${profile.tag}`
      : ""
    : (mockFriend?.tag ?? "#0000");
  const status = live ? (profile?.status ?? "offline") : (mockFriend?.status ?? "offline");
  const bio = live ? (profile?.bio || t("profile.noBio")) : "Grinding ranked, always down for a duo queue. DM me for scrims. GMT+1.";

  const onMessage = async () => {
    if (!live) {
      toast(t("profile.message") + " · " + displayName);
      return;
    }
    if (!user) {
      toast.error(t("auth.register.login"));
      return;
    }
    if (!profile) return;
    setBusy("dm");
    const result = await openDmWith(profile.id);
    setBusy(null);
    if (result.error || !result.threadId) {
      toast.error(result.error ?? "Could not open DM");
      return;
    }
    void navigate({ to: "/dm", search: { thread: result.threadId } });
  };

  const onAdd = async () => {
    if (!live) {
      toast.success(t("profile.requestSent"));
      return;
    }
    if (!user) {
      toast.error(t("auth.register.login"));
      return;
    }
    if (!profile) return;
    setBusy("friend");
    const result = await sendFriendRequestByTag(user.id, `${profile.username}#${profile.tag}`);
    setBusy(null);
    if (!result.ok) {
      toast.error(result.error ?? "Request failed");
      return;
    }
    toast.success(t("profile.requestSent"));
  };

  const onBlock = async () => {
    if (!live) {
      toast.success(t("profile.blocked"));
      return;
    }
    if (!user) {
      toast.error(t("auth.register.login"));
      return;
    }
    if (!profile) return;
    setBusy("block");
    const result = await blockUser(user.id, profile.id);
    setBusy(null);
    if (!result.ok) {
      toast.error(result.error ?? "Could not block");
      return;
    }
    toast.success(t("profile.blocked"));
  };

  return (
    <AppShell>
      <main className="min-h-0 flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border-subtle bg-background/80 px-4 backdrop-blur-md">
          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                window.history.back();
                return;
              }
              void navigate({ to: "/friends" });
            }}
            className="grid size-9 place-items-center rounded-lg text-stone-400 hover:bg-white/5 hover:text-white"
            aria-label={t("common.back")}
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
          </button>
          <h1 className="truncate font-display text-sm font-bold uppercase tracking-tight text-white">
            {t("profile.title")}
          </h1>
        </header>

        <div className="relative h-40 border-b border-border-subtle bg-gradient-to-br from-accent/25 via-stone-800/40 to-transparent md:h-56" />

        <div className="mx-auto max-w-3xl px-4 pb-16 md:px-6">
          {loading ? (
            <p className="mt-8 text-sm text-stone-500">{t("profile.loading")}</p>
          ) : live && !profile ? (
            <p className="mt-8 text-sm text-stone-500">{t("profile.notFound")}</p>
          ) : (
            <>
              <div className="-mt-14 flex flex-col items-start gap-4 md:-mt-16 md:flex-row md:items-end md:justify-between">
                <div className="flex items-end gap-4">
                  <div className="grid size-24 shrink-0 place-items-center rounded-2xl border-4 border-background bg-gradient-to-br from-accent/40 to-stone-700/40 font-display text-2xl font-bold text-white shadow-xl md:size-32 md:text-3xl">
                    {displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="pb-2">
                    <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white md:text-3xl">
                      {displayName}
                    </h2>
                    <p className="mt-1 flex items-center gap-2 text-xs text-stone-400">
                      <span
                        className={`size-2 rounded-full ${
                          status === "offline"
                            ? "bg-stone-600"
                            : "bg-online shadow-[var(--shadow-glow-online)]"
                        }`}
                      />
                      {status}
                      {tag ? ` · ${tag}` : ""}
                    </p>
                  </div>
                </div>

                {(!live || (profile && profile.id !== user?.id)) && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={busy === "dm"}
                      onClick={() => void onMessage()}
                      className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent-foreground hover:brightness-110 disabled:opacity-50"
                    >
                      <MessageSquare className="size-3.5" /> {t("profile.message")}
                    </button>
                    <button
                      disabled={busy === "friend"}
                      onClick={() => void onAdd()}
                      className="flex items-center gap-2 rounded-lg border border-border-subtle bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wide text-stone-200 hover:bg-white/10 disabled:opacity-50"
                    >
                      <UserPlus className="size-3.5" /> {t("profile.add")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (live && profile) {
                          setReportTarget({ targetUserId: profile.id });
                        } else {
                          setReportTarget({ targetUserId: "mock" });
                        }
                      }}
                      className="flex items-center gap-2 rounded-lg border border-border-subtle bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wide text-stone-200 hover:bg-white/10"
                    >
                      <Flag className="size-3.5" /> {t("profile.report")}
                    </button>
                    <button
                      type="button"
                      disabled={busy === "block"}
                      onClick={() => void onBlock()}
                      className="flex items-center gap-2 rounded-lg border border-border-subtle bg-danger/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-danger hover:bg-danger/15 disabled:opacity-50"
                    >
                      <Ban className="size-3.5" /> {t("friends.block")}
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-8 rounded-2xl border border-border-subtle bg-surface-mid p-5">
                <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-500">
                  {t("profile.about")}
                </h3>
                <p className="text-sm text-stone-300">{bio}</p>
              </div>

              <div className="mt-8">
                <h3 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-500">
                  <Gamepad2 className="size-3.5 text-accent" />
                  {t("profile.sharedHubs")}
                </h3>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {hubs.map((g) => (
                    <Link
                      key={g.id}
                      to="/"
                      search={{ hub: g.id }}
                      className={`group flex flex-col items-center gap-2 rounded-xl border border-border-subtle p-4 transition-all hover:border-accent/40 ${g.tint}`}
                    >
                      <span className={`font-display text-sm font-bold ${g.textTint}`}>{g.short}</span>
                      <span className="text-[11px] font-semibold text-stone-200">{g.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <ReportDialog
        open={!!reportTarget}
        onOpenChange={(open) => {
          if (!open) setReportTarget(null);
        }}
        target={reportTarget}
        onSubmit={async ({ reason, details, targetUserId }) => {
          if (!live || !user?.id || !profile) {
            toast.success(t("report.thanks"));
            return { ok: true };
          }
          const result = await submitReport({
            reporterId: user.id,
            targetUserId: targetUserId ?? profile.id,
            reason,
            details,
          });
          if (!result.ok) {
            toast.error(result.error ?? "Could not submit report");
            return result;
          }
          toast.success(t("report.thanks"));
          return { ok: true };
        }}
      />
    </AppShell>
  );
}
