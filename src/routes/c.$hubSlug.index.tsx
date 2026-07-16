import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { GameHomeHero } from "@/components/community/game-home-hero";
import { OnlineStrip } from "@/components/community/online-strip";
import { ActivityStrip } from "@/components/community/activity-strip";
import { VoiceRoomCard } from "@/components/community/voice-room-card";
import { FeaturedChannels } from "@/components/community/featured-channels";
import { ListSkeleton } from "@/components/ui-native";
import { useCommunity } from "@/hooks/use-community";
import { useAuth } from "@/lib/auth-provider";
import { getVoiceClient } from "@/lib/voice";
import { isLfgChannel } from "@/lib/lfg";
import { useT, translateStatic } from "@/lib/i18n";
import { resolveBackgroundUrl } from "@/lib/game-artwork";
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
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [activeVoiceId, setActiveVoiceId] = useState<string | null>(
    () => getVoiceClient().getSession()?.channelId ?? null,
  );

  useEffect(() => {
    return getVoiceClient().onSessionChange?.((session) => {
      setActiveVoiceId(session?.channelId ?? null);
    });
  }, []);

  const bg = resolveBackgroundUrl({
    backgroundUrl: community.game.backgroundUrl,
  });

  const joinVoice = (v: {
    id: string;
    name: string;
    livekitRoomName?: string | null;
  }) => {
    if (joiningId) return;
    void (async () => {
      setJoiningId(v.id);
      try {
        await getVoiceClient().joinVoiceChannel({
          channelId: v.id,
          channelName: v.name,
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

  useEffect(() => {
    if (community.error) toast.error(community.error);
  }, [community.error]);

  const hasLfg = community.featuredText.some((c) => isLfgChannel(c));

  return (
    <AppShell>
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {bg ? (
          <img
            src={bg}
            alt=""
            className="pointer-events-none absolute inset-0 size-full object-cover opacity-[0.12]"
          />
        ) : null}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
          {community.loading ? (
            <div className="p-4">
              <ListSkeleton rows={6} />
            </div>
          ) : (
            <>
              <GameHomeHero
                game={community.game}
                onlineCount={community.members.online.length}
              />
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

              <section className="mt-6 px-4" aria-label={t("community.voiceSection")}>
                <h2 className="nx-label mb-3 text-stone-400">{t("community.voiceSection")}</h2>
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
              </section>

              <div className="mt-6">
                <FeaturedChannels
                  hubSlug={community.slug}
                  channels={community.featuredText}
                  channelPathSlug={community.channelPathSlug}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
