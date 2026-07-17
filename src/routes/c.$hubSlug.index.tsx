import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Megaphone, LogIn } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { GameHomeHero } from "@/components/community/game-home-hero";
import { OnlineStrip } from "@/components/community/online-strip";
import { ActivityStrip } from "@/components/community/activity-strip";
import { VoiceRoomCard } from "@/components/community/voice-room-card";
import { FeaturedChannels } from "@/components/community/featured-channels";
import { CommunityNotFound } from "@/components/community/recovery";
import { ListSkeleton } from "@/components/ui-native";
import { Button } from "@/components/ui/button";
import { useCommunity } from "@/hooks/use-community";
import { useAuth } from "@/lib/auth-provider";
import { getVoiceClient } from "@/lib/voice";
import { isLfgChannel } from "@/lib/lfg";
import { useT, translateStatic } from "@/lib/i18n";
import { usePlatformFlags } from "@/hooks/use-platform-flags";
import { resolveBackgroundUrl } from "@/lib/game-artwork";
import { COMMUNITY_FEED_SECTION_ID } from "@/lib/community/feed-ext";
import { toast } from "sonner";

export const Route = createFileRoute("/c/$hubSlug/")({
  head: ({ params }) => ({
    meta: [
      {
        title: translateStatic("meta.page.community", { hub: params.hubSlug }),
      },
    ],
  }),
  component: CommunityGameHomePage,
});

function CommunityGameHomePage() {
  const { hubSlug } = Route.useParams();
  const community = useCommunity(hubSlug);
  const { accessToken, profile, user } = useAuth();
  const { t } = useT();
  const flags = usePlatformFlags();
  const voiceEnabled = flags["voice.enabled"];
  const lfgEnabled = flags["lfg.enabled"];
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [activeVoiceId, setActiveVoiceId] = useState<string | null>(
    () => getVoiceClient().getSession()?.channelId ?? null,
  );

  useEffect(() => {
    return getVoiceClient().onSessionChange?.((session) => {
      setActiveVoiceId(session?.channelId ?? null);
    });
  }, []);

  const bg = community.game
    ? resolveBackgroundUrl({
        backgroundUrl: community.game.backgroundUrl,
      })
    : null;

  const joinVoice = (v: {
    id: string;
    name: string;
    livekitRoomName?: string | null;
  }) => {
    if (joiningId || !community.isMember) return;
    if (!voiceEnabled) {
      toast.error(t("notice.flag.voiceOff"));
      return;
    }
    void (async () => {
      setJoiningId(v.id);
      try {
        await getVoiceClient().joinVoiceChannel({
          channelId: v.id,
          channelName: v.name,
          hubName: community.game?.hubName,
          roomName: v.livekitRoomName ?? `nexus-${v.id}`,
          accessToken,
          displayName: profile?.username ?? user?.email?.split("@")[0],
        });
        setActiveVoiceId(v.id);
        const live = getVoiceClient().getSession()?.live;
        toast.success(live ? t("voice.joinOk", { name: v.name }) : t("voice.joinedPreview"));
        void community.refreshOccupancy();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("voice.joinFail"));
      } finally {
        setJoiningId(null);
      }
    })();
  };

  const onJoinCommunity = () => {
    if (!user) {
      toast.error(t("toast.joinHubSignIn"));
      return;
    }
    void (async () => {
      const result = await community.joinCommunity();
      if (!result.ok) {
        toast.error(result.error ?? t("toast.joinHubFail"));
        return;
      }
      toast.success(
        t("toast.joinedHub", { name: community.game?.hubName ?? community.slug }),
      );
    })();
  };

  useEffect(() => {
    if (community.error) toast.error(community.error);
  }, [community.error]);

  const hasLfg = lfgEnabled && community.featuredText.some((c) => isLfgChannel(c));

  return (
    <AppShell>
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {bg ? (
          <img
            src={bg}
            alt=""
            loading="lazy"
            decoding="async"
            className="pointer-events-none absolute inset-0 size-full object-cover opacity-[0.12]"
          />
        ) : null}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
          {community.loading ? (
            <div className="p-4" aria-busy="true" aria-label={t("community.loading")}>
              <ListSkeleton rows={6} />
            </div>
          ) : community.hubNotFound || !community.game ? (
            <CommunityNotFound slug={hubSlug} />
          ) : (
            <>
              <GameHomeHero
                game={community.game}
                onlineCount={community.members.online.length}
              />

              {!community.isMember ? (
                <section className="mx-4 mt-4 rounded-2xl border border-accent/30 bg-accent/10 p-4">
                  <p className="nx-label text-accent">{t("community.visitor.eyebrow")}</p>
                  <h2 className="mt-1 text-lg font-semibold text-white">
                    {t("community.visitor.title")}
                  </h2>
                  <p className="mt-1 text-sm text-stone-300">{t("community.visitor.body")}</p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="accent"
                      className="flex-1 gap-2"
                      disabled={community.joining}
                      onClick={onJoinCommunity}
                    >
                      <LogIn className="size-4" />
                      {community.joining
                        ? t("community.visitor.joining")
                        : t("community.visitor.join")}
                    </Button>
                    <Button asChild variant="secondary" className="flex-1">
                      <Link to="/discover">{t("community.visitor.discover")}</Link>
                    </Button>
                  </div>
                </section>
              ) : (
                <>
                  <OnlineStrip online={community.members.online} />
                  <ActivityStrip
                    voiceLiveCount={community.voiceLiveCount}
                    totalUnread={community.totalUnread}
                    hasLfg={hasLfg}
                  />

                  {community.announcementTopic ? (
                    <section className="mx-4 mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3">
                      <div className="flex items-start gap-2">
                        <Megaphone className="mt-0.5 size-4 shrink-0 text-amber-200" />
                        <div>
                          <p className="nx-label text-amber-100/90">
                            {t("community.announcement")}
                          </p>
                          <p className="mt-1 text-sm text-stone-200" dir="auto">
                            {community.announcementTopic}
                          </p>
                        </div>
                      </div>
                    </section>
                  ) : null}

                  {/* Reserved for future Community Feed (architecture only). */}
                  <section
                    id={COMMUNITY_FEED_SECTION_ID}
                    className="mx-4 mt-5 hidden"
                    aria-hidden="true"
                    data-feed-ready="false"
                  />

                  <section
                    className="mt-6 px-4"
                    aria-label={t("community.voiceSection")}
                  >
                    <h2 className="nx-label mb-3 text-stone-400">
                      {t("community.voiceSection")}
                    </h2>
                    {community.voiceChannels.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-border-subtle/70 bg-surface-mid/40 px-4 py-6 text-center text-sm text-stone-500">
                        {t("community.voice.empty")}
                      </p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {community.voiceChannels.map((v) => (
                          <VoiceRoomCard
                            key={v.id}
                            room={v}
                            joined={activeVoiceId === v.id}
                            joining={joiningId === v.id}
                            onJoin={() => joinVoice(v)}
                          />
                        ))}
                      </div>
                    )}
                  </section>

                  <div className="mt-6" id="channels">
                    <FeaturedChannels
                      hubSlug={community.slug}
                      channels={community.featuredText}
                      channelPathSlug={community.channelPathSlug}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
