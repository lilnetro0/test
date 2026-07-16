import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  checkHubMembership,
  fetchChannels,
  fetchHubBySlug,
  fetchHubMembers,
  joinHub,
  refreshHubActiveCount,
  type LiveHub,
} from "@/lib/chat/api";
import { listVoiceRoomOccupancy } from "@/lib/voice/list-voice-occupancy";
import { setLastHub } from "@/lib/prefs";
import { isLfgChannel } from "@/lib/lfg";

const OCCUPANCY_POLL_MS = 12_000;

/**
 * Community Game Home data — hub identity, membership, channels, voice occupancy.
 * Does NOT auto-join. Opening a URL only loads preview or member content.
 */
export function useCommunity(hubSlug: string) {
  const live = !shouldUseMockData();
  const { user, accessToken } = useAuth();
  const slug = hubSlug.trim();

  const [resolvedHub, setResolvedHub] = useState<LiveHub | null>(null);
  const [hubNotFound, setHubNotFound] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const [textChannels, setTextChannels] = useState<TextChannel[]>([]);
  const [voiceChannels, setVoiceChannels] = useState<VoiceChannel[]>([]);
  const [members, setMembers] = useState<{ online: MemberInfo[]; offline: MemberInfo[] }>({
    online: [],
    offline: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [occupancyConfigured, setOccupancyConfigured] = useState(false);
  const pollActiveRef = useRef(false);

  const game = useMemo<HubCard | null>(() => {
    if (!slug) return null;
    if (!live) {
      return (
        DISCOVER_HUBS.find((g) => g.id === slug) ??
        GAMES.find((g) => g.id === slug) ??
        null
      );
    }
    return resolvedHub?.game ?? null;
  }, [live, slug, resolvedHub]);

  const mockHub = slug ? HUBS[slug] ?? null : null;

  const displayText = live ? textChannels : mockHub?.textChannels ?? [];
  const displayVoice = live ? voiceChannels : mockHub?.voiceChannels ?? [];
  const displayMembers = live ? members : mockHub?.members ?? { online: [], offline: [] };

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

  const loadMemberContent = useCallback(
    async (hub: LiveHub) => {
      const [ch, mem] = await Promise.all([
        fetchChannels(hub.uuid),
        fetchHubMembers(hub.uuid),
      ]);
      if (ch.error) setError(ch.error);
      setTextChannels(ch.text);
      setMembers({ online: mem.online, offline: mem.offline });
      const withOcc = await mergeOccupancy(hub.uuid, ch.voice);
      setVoiceChannels(withOcc);
      const active = await refreshHubActiveCount(hub.uuid);
      if (active.activeCount) {
        setResolvedHub((prev) =>
          prev && prev.uuid === hub.uuid
            ? { ...prev, game: { ...prev.game, activeCount: active.activeCount! } }
            : prev,
        );
      }
    },
    [mergeOccupancy],
  );

  // Resolve hub + membership (never auto-join)
  useEffect(() => {
    if (!slug) {
      setHubNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setHubNotFound(false);
    setTextChannels([]);
    setVoiceChannels([]);
    setMembers({ online: [], offline: [] });

    void (async () => {
      if (!live) {
        const card =
          DISCOVER_HUBS.find((g) => g.id === slug) ?? GAMES.find((g) => g.id === slug) ?? null;
        if (!card || !HUBS[slug]) {
          if (!cancelled) {
            setHubNotFound(true);
            setResolvedHub(null);
            setIsMember(false);
            setLoading(false);
          }
          return;
        }
        if (!cancelled) {
          setResolvedHub(null);
          setIsMember(true);
          setLastHub(slug);
          setLoading(false);
        }
        return;
      }

      const { hub, error: hubErr } = await fetchHubBySlug(slug);
      if (cancelled) return;
      if (hubErr) setError(hubErr);
      if (!hub) {
        setHubNotFound(true);
        setResolvedHub(null);
        setIsMember(false);
        setLoading(false);
        return;
      }

      setResolvedHub(hub);
      setHubNotFound(false);

      if (!user?.id) {
        setIsMember(false);
        setLoading(false);
        return;
      }

      const mem = await checkHubMembership(hub.uuid, user.id);
      if (cancelled) return;
      if (mem.error) setError(mem.error);
      setIsMember(mem.isMember);

      if (mem.isMember) {
        setLastHub(slug);
        await loadMemberContent(hub);
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [live, slug, user?.id, loadMemberContent]);

  // Occupancy poll — only while member, Game Home mounted, and document visible
  useEffect(() => {
    if (!live || !isMember || !resolvedHub?.uuid || !accessToken) return;

    let cancelled = false;
    let intervalId: number | null = null;

    const tick = async () => {
      if (cancelled || document.hidden || !pollActiveRef.current) return;
      const ch = await fetchChannels(resolvedHub.uuid);
      if (cancelled || ch.error) return;
      setTextChannels(ch.text);
      const withOcc = await mergeOccupancy(resolvedHub.uuid, ch.voice);
      if (!cancelled) setVoiceChannels(withOcc);
    };

    const start = () => {
      pollActiveRef.current = true;
      if (intervalId != null) return;
      intervalId = window.setInterval(() => {
        void tick();
      }, OCCUPANCY_POLL_MS);
    };

    const stop = () => {
      pollActiveRef.current = false;
      if (intervalId != null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        start();
        void tick();
      }
    };

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, [live, isMember, resolvedHub?.uuid, accessToken, mergeOccupancy]);

  const refreshOccupancy = useCallback(async () => {
    if (!live || !resolvedHub?.uuid || !isMember) return;
    const ch = await fetchChannels(resolvedHub.uuid);
    if (ch.error) return;
    setTextChannels(ch.text);
    const next = await mergeOccupancy(resolvedHub.uuid, ch.voice);
    setVoiceChannels(next);
  }, [live, resolvedHub?.uuid, isMember, mergeOccupancy]);

  const joinCommunity = useCallback(async () => {
    if (!live || !resolvedHub?.uuid || !user?.id || joining) {
      return { ok: false as const, error: "Not ready" };
    }
    setJoining(true);
    setError(null);
    try {
      const result = await joinHub(resolvedHub.uuid, user.id);
      if (!result.ok) {
        setError(result.error ?? "Could not join");
        return { ok: false as const, error: result.error };
      }
      setIsMember(true);
      setLastHub(slug);
      await loadMemberContent(resolvedHub);
      return { ok: true as const };
    } finally {
      setJoining(false);
    }
  }, [live, resolvedHub, user?.id, joining, slug, loadMemberContent]);

  const channelPathSlug = useCallback((c: TextChannel) => c.slug?.trim() || c.id, []);

  return {
    live,
    loading,
    error,
    slug,
    hubNotFound,
    isMember,
    joining,
    joinCommunity,
    game,
    hubUuid: resolvedHub?.uuid ?? game?.hubUuid ?? null,
    textChannels: isMember || !live ? displayText : [],
    voiceChannels: isMember || !live ? displayVoice : [],
    featuredText: isMember || !live ? featuredText : [],
    members: isMember || !live ? displayMembers : { online: [], offline: [] },
    announcementTopic: isMember || !live ? announcementTopic : null,
    totalUnread: isMember || !live ? totalUnread : 0,
    voiceLiveCount: isMember || !live ? voiceLiveCount : 0,
    occupancyConfigured,
    refreshOccupancy,
    channelPathSlug,
    occupancyPollMs: OCCUPANCY_POLL_MS,
  };
}
