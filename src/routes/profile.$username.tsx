import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppNav } from "@/components/app-nav";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { ListSkeleton, ScreenHeader } from "@/components/ui-native";
import { Button } from "@/components/ui/button";
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
        <ScreenHeader
          className="sticky top-0 z-10 bg-background/95"
          title={t("profile.title")}
          leading={
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  window.history.back();
                  return;
                }
                void navigate({ to: "/friends" });
              }}
              className="nx-touch grid place-items-center rounded-lg text-stone-400 hover:bg-white/5 hover:text-white"
              aria-label={t("common.back")}
            >
              <ArrowLeft className="size-4 rtl:rotate-180" />
            </button>
          }
        />

        <div className="relative h-36 overflow-hidden border-b border-border-subtle/70 md:h-48">
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_0%,color-mix(in_oklab,var(--accent)_18%,transparent),transparent_50%),linear-gradient(200deg,oklch(0.22_0.02_280),transparent_45%),linear-gradient(to_bottom,oklch(0.18_0.01_260),var(--background))]"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="mx-auto max-w-3xl px-4 pb-16 md:px-6">
          {loading ? (
            <div className="mt-6">
              <ListSkeleton rows={4} />
            </div>
          ) : live && !profile ? (
            <EmptyState
              icon={Gamepad2}
              title={t("profile.notFound")}
              body={t("empty.search.body")}
              className="min-h-[240px]"
            />
          ) : (
            <>
              <div className="-mt-14 flex flex-col items-start gap-5 md:-mt-16 md:flex-row md:items-end md:justify-between">
                <div className="flex items-end gap-4">
                  <div className="grid size-28 shrink-0 place-items-center rounded-[1.35rem] border-[3px] border-background bg-gradient-to-br from-accent/30 to-stone-800/50 font-display text-2xl font-semibold text-white shadow-[var(--nx-shadow-2)] md:size-32 md:text-3xl">
                    {displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="pb-1">
                    <h2 className="nx-display text-[1.85rem] md:text-[2.15rem]">{displayName}</h2>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle/80 bg-white/[0.03] px-2.5 py-1 shadow-[var(--nx-shadow-1)]">
                        <span
                          className={`size-1.5 rounded-full ${
                            status === "offline" ? "bg-stone-500" : "bg-online"
                          }`}
                        />
                        <span className="nx-caption text-stone-300">{status}</span>
                      </span>
                      {tag ? (
                        <span className="nx-caption font-mono text-stone-500">{tag}</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {(!live || (profile && profile.id !== user?.id)) && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="accent"
                      size="sm"
                      disabled={busy === "dm"}
                      onClick={() => void onMessage()}
                    >
                      <MessageSquare className="size-3.5" /> {t("profile.message")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={busy === "friend"}
                      onClick={() => void onAdd()}
                    >
                      <UserPlus className="size-3.5" /> {t("profile.add")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (live && profile) {
                          setReportTarget({ targetUserId: profile.id });
                        } else {
                          setReportTarget({ targetUserId: "mock" });
                        }
                      }}
                    >
                      <Flag className="size-3.5" /> {t("profile.report")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={busy === "block"}
                      onClick={() => void onBlock()}
                      className="text-danger hover:text-danger"
                    >
                      <Ban className="size-3.5" /> {t("friends.block")}
                    </Button>
                  </div>
                )}
              </div>

              <section className="mt-10 space-y-2.5">
                <h3 className="nx-section">{t("profile.about")}</h3>
                <p className="nx-body max-w-prose text-pretty">{bio}</p>
              </section>

              <section className="mt-10">
                <h3 className="nx-section mb-4 flex items-center gap-2">
                  <Gamepad2 className="size-3.5 text-accent/80" strokeWidth={1.75} />
                  {t("profile.sharedHubs")}
                </h3>
                {hubs.length === 0 ? (
                  <p className="nx-body">{t("me.noHubs")}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {hubs.map((g) => (
                      <AppNav
                        key={g.id}
                        to="/c/$hubSlug"
                        params={{ hubSlug: g.id }}
                        className={`nx-press group flex flex-col items-center gap-2 rounded-2xl border border-border-subtle/70 p-4 shadow-[var(--nx-shadow-1)] transition-colors hover:border-accent/30 ${g.tint}`}
                      >
                        <span className={`font-display text-sm font-semibold ${g.textTint}`}>
                          {g.short}
                        </span>
                        <span className="nx-caption text-center text-stone-300">{g.name}</span>
                      </AppNav>
                    ))}
                  </div>
                )}
              </section>
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
