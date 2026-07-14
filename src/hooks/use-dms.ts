import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DM_CONVERSATIONS, type ChatMessage, type DMConversation } from "@/lib/mock-data";
import { shouldUseMockData } from "@/lib/supabase/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-provider";
import {
  fetchDmMessage,
  fetchDmMessages,
  fetchDmThreads,
  sendDmMessage,
} from "@/lib/social/api";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useDms(initialThreadId?: string) {
  const live = !shouldUseMockData();
  const { user, profile } = useAuth();

  const [threads, setThreads] = useState<DMConversation[]>(() =>
    live ? [] : DM_CONVERSATIONS,
  );
  const [activeId, setActiveId] = useState<string | null>(() =>
    live ? (initialThreadId ?? null) : (initialThreadId ?? DM_CONVERSATIONS[0]?.id ?? null),
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(live);
  const [error, setError] = useState<string | null>(null);
  const threadRef = useRef<string | null>(null);

  const refreshThreads = useCallback(async () => {
    if (!live) {
      setThreads(DM_CONVERSATIONS);
      setLoading(false);
      return;
    }
    if (!user) {
      setThreads([]);
      setActiveId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { threads: next, error: err } = await fetchDmThreads(user.id);
    if (err) setError(err);
    setThreads(next);
    setActiveId((prev) => {
      if (initialThreadId && next.some((t) => t.id === initialThreadId)) return initialThreadId;
      if (prev && next.some((t) => t.id === prev)) return prev;
      return next[0]?.id ?? null;
    });
    setLoading(false);
  }, [live, user?.id, initialThreadId]);

  useEffect(() => {
    void refreshThreads();
  }, [refreshThreads]);

  useEffect(() => {
    if (initialThreadId) setActiveId(initialThreadId);
  }, [initialThreadId]);

  // Load messages + realtime
  useEffect(() => {
    if (!live) {
      const conv = DM_CONVERSATIONS.find((c) => c.id === activeId);
      setMessages(conv?.messages ?? []);
      return;
    }
    if (!activeId || !UUID_RE.test(activeId)) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    threadRef.current = activeId;

    void fetchDmMessages(activeId).then(({ messages: msgs, error: err }) => {
      if (cancelled || threadRef.current !== activeId) return;
      if (err) setError(err);
      setMessages(msgs);
    });

    const client = getSupabaseBrowserClient();
    if (!client) return;

    const topic = client
      .channel(`nexus-dms:${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dm_messages",
          filter: `thread_id=eq.${activeId}`,
        },
        (payload) => {
          if (threadRef.current !== activeId) return;
          const id = (payload.new as { id: string }).id;
          void fetchDmMessage(id).then((msg) => {
            if (!msg || threadRef.current !== activeId) return;
            setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
            setThreads((prev) =>
              prev.map((t) =>
                t.id === activeId
                  ? { ...t, lastMessage: msg.body, lastTime: msg.time }
                  : t,
              ),
            );
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void client.removeChannel(topic);
    };
  }, [live, activeId]);

  const active = useMemo(() => {
    const t =
      threads.find((c) => c.id === activeId) ??
      (!live ? DM_CONVERSATIONS.find((c) => c.id === activeId) : null) ??
      null;
    if (!t) return null;
    return { ...t, messages };
  }, [live, threads, activeId, messages]);

  const displayThreads = useMemo(() => {
    return threads.map((t) =>
      t.id === activeId ? { ...t, messages, lastMessage: messages.at(-1)?.body ?? t.lastMessage } : t,
    );
  }, [threads, activeId, messages]);

  const send = useCallback(
    async (
      body: string,
      attachment?: { url: string; name: string; mime: string },
    ) => {
      if (!live) {
        if (!activeId) return { ok: false as const, error: "Not ready" };
        const now = new Date();
        const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        const message: ChatMessage = {
          id: `local-${now.getTime()}`,
          author: profile?.username ?? "You",
          authorId: user?.id,
          time,
          body,
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
        setThreads((prev) =>
          prev.map((t) =>
            t.id === activeId ? { ...t, lastMessage: message.body, lastTime: message.time } : t,
          ),
        );
        return { ok: true as const };
      }
      if (!user || !activeId) return { ok: false as const, error: "Not ready" };
      const { message, error: err } = await sendDmMessage({
        threadId: activeId,
        authorId: user.id,
        body,
        attachment,
      });
      if (err || !message) return { ok: false as const, error: err ?? "Send failed" };
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeId
            ? { ...t, lastMessage: message.body, lastTime: message.time }
            : t,
        ),
      );
      return { ok: true as const };
    },
    [live, user, activeId, profile?.username],
  );

  return {
    live,
    loading,
    error,
    threads: displayThreads,
    activeId,
    setActiveId,
    active,
    messages,
    profileName: profile?.username ?? "You",
    refreshThreads,
    send,
  };
}
