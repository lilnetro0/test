import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DISCOVER_HUBS,
  GAMES,
  HUBS,
  type HubCard,
  type MemberInfo,
  type TextChannel,
  type VoiceChannel,
} from "@/lib/mock-data";
import { shouldUseMockData } from "@/lib/supabase/env";
import { useAuth } from "@/lib/auth-provider";
import {
  fetchChannels,
  fetchHubMembers,
  fetchLiveHubs,
  joinHub,
  refreshHubActiveCount,
  type LiveHub,
} from "@/lib/chat/api";
import { listVoiceRoomOccupancy } from "@/lib/voice/list-voice-occupancy";
import { setLastHub } from "@/lib/prefs";
import { isLfgChannel } from "@/lib/lfg";

/**
 * Community Game Home data — hub identity, members, channels, voice occupancy.
 * Does not load messages (chat route owns that).
 */
export function useCommunity(hubSlug: string) {
  const live = !shouldUseMockData();
  const { user, accessToken } = useAuth();
  const slug = hubSlug.trim() || "fortnite";

  const [liveHubs, setLiveHubs] = useState<LiveHub[]>([]);
  const [textChannels, setTextChannels] = useState<TextChannel[]>([]);
  const [voiceChannels, setVoiceChannels] = useState<VoiceChannel[]>([]);
  const [members, setMembers] = useState<{ online: MemberInfo[]; offline: MemberInfo[] }>({
    online: [],
    offline: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [occupancyConfigured, setOccupancyConfigured] = useState(false);

  const activeHub = useMemo(() => {
    if (!live) return null;
    return liveHubs.find((h) => h.slug === slug) ?? null;
  }, [live, liveHubs, slug]);

  const game = useMemo<HubCard>(() => {
    if (!live) {
      return (
        DISCOVER_HUBS.find((g) => g.id === slug) ??
        GAMES.find((g) => g.id === slug) ??
        GAMES[0]
      );
    }
    return (
      activeHub?.game ??
      liveHubs[0]?.game ??
      GAMES[0]
    );
  }, [live, slug, activeHub, liveHubs]);

  const mockHub = HUBS[slug] ?? HUBS.fortnite;

  const displayText = live ? textChannels : mockHub.textChannels;
  const displayVoice = live ? voiceChannels : mockHub.voiceChannels;
  const displayMembers = live ? members : mockHub.members;

  const featuredText = useMemo(() => {
    const list = [...displayText];
    list.sort((a, b) => {
      const aLfg = isLfgChannel(a) ? 0 : 1;
      const bLfg = isLfgChannel(b) ? 0 : 1;
      if (aLfg !== bLfg) return aLfg - bLfg;
      const aU = a.unread ?? 0;
      const bU = b.unread ?? 0;
      if (aU !== bU) return bU - aU;
      return 0;
    });
    return list;
  }, [displayText]);

  const announcementTopic = useMemo(() => {
    const withTopic = displayText.find((c) => c.topic?.trim());
    return withTopic?.topic?.trim() ?? null;
  }, [displayText]);

  const totalUnread = useMemo(
    () => displayText.reduce((sum, c) => sum + (c.unread ?? 0), 0),
    [displayText],
  );

  const voiceLiveCount = useMemo(
    () => displayVoice.reduce((sum, v) => sum + (v.members?.length ?? 0), 0),
    [displayVoice],
  );

  const mergeOccupancy = useCallback(
    async (hubUuid: string, base: VoiceChannel[]) => {
      if (!accessToken) return base;
      const result = await listVoiceRoomOccupancy({
        data: { accessToken, hubId: hubUuid },
      });
      if (!result.ok) return base;
      setOccupancyConfigured(result.configured);
      const byId = new Map(result.channels.map((c) => [c.channelId, c]));
      return base.map((v) => {
        const occ = byId.get(v.id);
        if (!occ) return v;
        return {
          ...v,
          capacity: occ.capacity ?? v.capacity,
          members: occ.members.map((m) => ({
            name: m.name,
            userId: m.userId,
            muted: m.muted,
          })),
        };
      });
    },
    [accessToken],
  );

  // Catalog
  useEffect(() => {
    setLastHub(slug);
    if (!live) {
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchLiveHubs().then(({ hubs, error: err }) => {
      if (cancelled) return;
      if (err) setError(err);
      setLiveHubs(hubs);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [live, slug]);

  // Join + channels + members
  useEffect(() => {
    if (!live) return;
    if (!activeHub?.uuid || !user?.id) return;
    let cancelled = false;

    void (async () => {
      setError(null);
      const joined = await joinHub(activeHub.uuid, user.id);
      if (cancelled) return;
      if (!joined.ok) {
        setError(joined.error ?? "Could not join hub");
        return;
      }

      const [ch, mem] = await Promise.all([
        fetchChannels(activeHub.uuid),
        fetchHubMembers(activeHub.uuid),
      ]);
      if (cancelled) return;
      if (ch.error) setError(ch.error);
      setTextChannels(ch.text);
      setMembers({ online: mem.online, offline: mem.offline });

      const withOcc = await mergeOccupancy(activeHub.uuid, ch.voice);
      if (!cancelled) setVoiceChannels(withOcc);

      const active = await refreshHubActiveCount(activeHub.uuid);
      if (!cancelled && active.activeCount) {
        setLiveHubs((prev) =>
          prev.map((h) =>
            h.uuid === activeHub.uuid
              ? { ...h, game: { ...h.game, activeCount: active.activeCount! } }
              : h,
          ),
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [live, activeHub?.uuid, user?.id, mergeOccupancy]);

  // Poll occupancy while Game Home is mounted
  useEffect(() => {
    if (!live || !activeHub?.uuid || !accessToken) return;
    let cancelled = false;
    const tick = async () => {
      const ch = await fetchChannels(activeHub.uuid);
      if (cancelled || ch.error) return;
      setTextChannels(ch.text);
      const withOcc = await mergeOccupancy(activeHub.uuid, ch.voice);
      if (!cancelled) setVoiceChannels(withOcc);
    };
    const id = window.setInterval(() => {
      void tick();
    }, 12_000);
    const onFocus = () => {
      void tick();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [live, activeHub?.uuid, accessToken, mergeOccupancy]);

  const refreshOccupancy = useCallback(async () => {
    if (!live || !activeHub?.uuid) return;
    const ch = await fetchChannels(activeHub.uuid);
    if (ch.error) return;
    setTextChannels(ch.text);
    const next = await mergeOccupancy(activeHub.uuid, ch.voice);
    setVoiceChannels(next);
  }, [live, activeHub?.uuid, mergeOccupancy]);

  const channelPathSlug = useCallback((c: TextChannel) => c.slug?.trim() || c.id, []);

  return {
    live,
    loading,
    error,
    slug,
    game,
    hubUuid: activeHub?.uuid ?? game.hubUuid ?? null,
    textChannels: displayText,
    voiceChannels: displayVoice,
    featuredText,
    members: displayMembers,
    announcementTopic,
    totalUnread,
    voiceLiveCount,
    occupancyConfigured,
    refreshOccupancy,
    channelPathSlug,
  };
}
