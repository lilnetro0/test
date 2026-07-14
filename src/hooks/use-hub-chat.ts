import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GAMES,
  HUBS,
  type ChatMessage,
  type Game,
  type MemberInfo,
  type TextChannel,
  type VoiceChannel,
} from "@/lib/mock-data";
import { shouldUseMockData } from "@/lib/supabase/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-provider";
import {
  deleteChannelMessage,
  editChannelMessage,
  fetchChannels,
  fetchHubMembers,
  fetchLiveHubs,
  fetchMessage,
  fetchMessages,
  joinHub,
  sendChannelMessage,
  setMessagePinned,
  toggleReaction,
  type LiveHub,
} from "@/lib/chat/api";
import { adminDeleteMessage, adminPinMessage } from "@/lib/admin/api";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isChannelUuid(id: string): boolean {
  return UUID_RE.test(id);
}

const EMPTY_CHANNEL: TextChannel = { id: "", name: "…" };

export function useHubChat(opts?: { initialSlug?: string }) {
  const live = !shouldUseMockData();
  const { user, profile } = useAuth();
  const initialSlug = opts?.initialSlug?.trim() || undefined;

  const [liveHubs, setLiveHubs] = useState<LiveHub[]>([]);
  const [activeSlug, setActiveSlug] = useState(initialSlug || "fortnite");
  const [activeChannelId, setActiveChannelId] = useState(() =>
    shouldUseMockData() ? "general" : "",
  );
  const [textChannels, setTextChannels] = useState<TextChannel[]>([]);
  const [voiceChannels, setVoiceChannels] = useState<VoiceChannel[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    shouldUseMockData() ? [...(HUBS[initialSlug || "fortnite"] ?? HUBS.fortnite).messages] : [],
  );
  const [members, setMembers] = useState<{ online: MemberInfo[]; offline: MemberInfo[] }>({
    online: [],
    offline: [],
  });
  const [loading, setLoading] = useState(live);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<string | null>(null);

  const games = useMemo<Game[]>(() => {
    if (!live) return GAMES;
    return liveHubs.map((h) => h.game);
  }, [live, liveHubs]);

  const activeHub = useMemo(() => {
    if (!live) return null;
    return liveHubs.find((h) => h.slug === activeSlug) ?? liveHubs[0] ?? null;
  }, [live, liveHubs, activeSlug]);

  const game = useMemo<Game>(() => {
    if (!live) return GAMES.find((g) => g.id === activeSlug) ?? GAMES[0];
    return activeHub?.game ?? games[0] ?? GAMES[0];
  }, [live, activeSlug, activeHub, games]);

  const mockHub = HUBS[activeSlug] ?? HUBS.fortnite;

  const activeChannel = useMemo(() => {
    if (!live) {
      return mockHub.textChannels.find((c) => c.id === activeChannelId) ?? mockHub.textChannels[0];
    }
    return textChannels.find((c) => c.id === activeChannelId) ?? textChannels[0] ?? EMPTY_CHANNEL;
  }, [live, mockHub, textChannels, activeChannelId]);

  const displayMessages = messages;
  const displayTextChannels = live ? textChannels : mockHub.textChannels;
  const displayVoiceChannels = live ? voiceChannels : mockHub.voiceChannels;
  const displayMembers = live ? members : mockHub.members;
  const pinnedCount = messages.filter((m) => m.pinned).length;

  // Seed mock thread into mutable state so local send/edit/react show up.
  useEffect(() => {
    if (live) return;
    const hub = HUBS[activeSlug] ?? HUBS.fortnite;
    setMessages([...hub.messages]);
  }, [live, activeSlug]);

  // Load hub catalog (live)
  useEffect(() => {
    if (!live) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchLiveHubs().then(({ hubs, error: err }) => {
      if (cancelled) return;
      if (err) setError(err);
      setLiveHubs(hubs);
      if (hubs.length) {
        const preferred = initialSlug && hubs.find((h) => h.slug === initialSlug);
        if (preferred) setActiveSlug(preferred.slug);
        else if (!hubs.find((h) => h.slug === activeSlug)) setActiveSlug(hubs[0].slug);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot once when live
  }, [live]);

  useEffect(() => {
    if (!initialSlug) return;
    setActiveSlug(initialSlug);
  }, [initialSlug]);

  // Join hub + load channels/members when hub changes
  useEffect(() => {
    if (!live || !activeHub || !user) return;
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
      setVoiceChannels(ch.voice);
      setMembers({ online: mem.online, offline: mem.offline });

      const first = ch.text[0]?.id;
      setActiveChannelId((prev) => {
        if (prev && ch.text.some((c) => c.id === prev)) return prev;
        return first ?? "";
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [live, activeHub?.uuid, user?.id]);

  // Load messages + realtime for active channel
  useEffect(() => {
    if (!live || !activeChannelId || !isChannelUuid(activeChannelId)) return;

    let cancelled = false;
    channelRef.current = activeChannelId;

    void fetchMessages(activeChannelId, { viewerId: user?.id }).then(({ messages: msgs, error: err }) => {
      if (cancelled || channelRef.current !== activeChannelId) return;
      if (err) setError(err);
      setMessages(msgs);
    });

    const client = getSupabaseBrowserClient();
    if (!client) return;

    const refreshMsg = (id: string) => {
      void fetchMessage(id, user?.id).then((msg) => {
        if (!msg || channelRef.current !== activeChannelId) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) {
            return prev.map((m) => (m.id === msg.id ? msg : m));
          }
          return [...prev, msg];
        });
      });
    };

    const topic = client
      .channel(`nexus-messages:${activeChannelId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${activeChannelId}`,
        },
        (payload) => {
          if (channelRef.current !== activeChannelId) return;
          if (payload.eventType === "DELETE") {
            const id = (payload.old as { id: string }).id;
            setMessages((prev) => prev.filter((m) => m.id !== id));
            return;
          }
          const id = (payload.new as { id: string }).id;
          refreshMsg(id);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
        },
        (payload) => {
          if (channelRef.current !== activeChannelId) return;
          const mid =
            (payload.new as { message_id?: string } | null)?.message_id ??
            (payload.old as { message_id?: string } | null)?.message_id;
          if (mid) refreshMsg(mid);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void client.removeChannel(topic);
    };
  }, [live, activeChannelId, user?.id]);

  const selectGame = useCallback(
    (slug: string) => {
      setActiveSlug(slug);
      setMessages([]);
      if (!live) {
        setActiveChannelId(HUBS[slug]?.textChannels[0]?.id ?? "general");
      } else {
        setActiveChannelId("");
      }
    },
    [live],
  );

  const selectChannel = useCallback((id: string) => {
    setActiveChannelId(id);
  }, []);

  const sendMessage = useCallback(
    async (
      body: string,
      replyToId?: string,
      attachment?: { url: string; name: string; mime: string },
    ) => {
      if (!live) {
        const now = new Date();
        const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        const replySrc = replyToId ? messages.find((m) => m.id === replyToId) : undefined;
        const message: ChatMessage = {
          id: `local-${now.getTime()}`,
          author: profile?.username ?? "You",
          authorId: user?.id,
          time,
          body,
          replyTo: replySrc ? { author: replySrc.author, body: replySrc.body } : undefined,
          attachment: attachment
            ? {
                name: attachment.name,
                kind: attachment.mime.startsWith("image/") ? "image" : "file",
                meta: attachment.mime,
                url: attachment.url,
              }
            : undefined,
        };
        setMessages((prev) => [...prev, message]);
        return { ok: true as const, message };
      }
      if (!user || !activeChannelId || !isChannelUuid(activeChannelId)) {
        return { ok: false as const, error: "Not ready" };
      }
      const { message, error: err } = await sendChannelMessage({
        channelId: activeChannelId,
        authorId: user.id,
        body,
        replyToId,
        attachment,
      });
      if (err || !message) return { ok: false as const, error: err ?? "Send failed" };
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      return { ok: true as const, message };
    },
    [live, user, activeChannelId, messages, profile?.username],
  );

  const editMessage = useCallback(
    async (messageId: string, body: string) => {
      if (!live) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, body, edited: true } : m)),
        );
        return { ok: true as const };
      }
      const { message, error: err } = await editChannelMessage(messageId, body);
      if (err || !message) return { ok: false as const, error: err ?? "Edit failed" };
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...message, reactions: m.reactions } : m)));
      return { ok: true as const };
    },
    [live],
  );

  const reactToMessage = useCallback(
    async (messageId: string, emoji: string) => {
      if (!live || !user) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId) return m;
            const rs = [...(m.reactions ?? [])];
            const i = rs.findIndex((r) => r.emoji === emoji);
            if (i >= 0) {
              const cur = rs[i];
              if (cur.mine) {
                if (cur.count <= 1) rs.splice(i, 1);
                else rs[i] = { ...cur, count: cur.count - 1, mine: false };
              } else {
                rs[i] = { ...cur, count: cur.count + 1, mine: true };
              }
            } else {
              rs.push({ emoji, count: 1, mine: true });
            }
            return { ...m, reactions: rs };
          }),
        );
        return { ok: true as const };
      }
      const { reactions, error: err } = await toggleReaction({
        messageId,
        userId: user.id,
        emoji,
      });
      if (err) return { ok: false as const, error: err };
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)));
      return { ok: true as const };
    },
    [live, user],
  );

  const pinMessage = useCallback(
    async (messageId: string, pinned: boolean, adminToken?: string) => {
      if (!live) {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, pinned } : m)));
        return { ok: true as const };
      }
      if (adminToken) {
        const result = await adminPinMessage({
          data: { accessToken: adminToken, messageId, pinned },
        });
        if (!result.ok) return { ok: false as const, error: result.error };
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, pinned } : m)));
        return { ok: true as const };
      }
      const result = await setMessagePinned(messageId, pinned);
      if (!result.ok) return result;
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, pinned } : m)));
      return { ok: true as const };
    },
    [live],
  );

  const deleteMessage = useCallback(
    async (messageId: string, adminToken?: string) => {
      if (!live) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        return { ok: true as const };
      }
      if (adminToken) {
        const result = await adminDeleteMessage({
          data: { accessToken: adminToken, messageId },
        });
        if (!result.ok) return { ok: false as const, error: result.error };
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        return { ok: true as const };
      }
      const result = await deleteChannelMessage(messageId);
      if (!result.ok) return result;
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      return { ok: true as const };
    },
    [live],
  );

  const searchMessages = useCallback(
    async (query: string) => {
      if (!live || !activeChannelId || !isChannelUuid(activeChannelId)) {
        return displayMessages;
      }
      const q = query.trim();
      if (!q) {
        const { messages: msgs } = await fetchMessages(activeChannelId, { viewerId: user?.id });
        setMessages(msgs);
        return msgs;
      }
      const { messages: msgs } = await fetchMessages(activeChannelId, {
        query: q,
        limit: 100,
        viewerId: user?.id,
      });
      setMessages(msgs);
      return msgs;
    },
    [live, activeChannelId, displayMessages, user?.id],
  );

  return {
    live,
    loading,
    error,
    games,
    game,
    activeSlug,
    activeHubUuid: activeHub?.uuid ?? null,
    activeChannelId,
    activeChannel,
    textChannels: displayTextChannels,
    voiceChannels: displayVoiceChannels,
    messages: displayMessages,
    members: displayMembers,
    pinnedCount,
    profileName: profile?.username ?? "You",
    selectGame,
    selectChannel,
    sendMessage,
    editMessage,
    reactToMessage,
    pinMessage,
    deleteMessage,
    searchMessages,
  };
}
