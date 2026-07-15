import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { shouldUseMockData } from "@/lib/supabase/env";
import type { RealtimeChannel } from "@supabase/supabase-js";

const TYPING_TTL_MS = 3200;
const TYPING_THROTTLE_MS = 1200;

type TypingPeer = { userId: string; username: string; expiresAt: number };

/**
 * Ephemeral typing via Supabase Realtime broadcast (no SQL table).
 * topicKey e.g. `channel:{uuid}` or `dm:{uuid}`.
 */
export function useTypingIndicator(opts: {
  topicKey: string | null;
  userId?: string;
  username?: string;
  enabled?: boolean;
}) {
  const { topicKey, userId, username, enabled = true } = opts;
  const live = !shouldUseMockData() && enabled;
  const [peers, setPeers] = useState<TypingPeer[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastSent = useRef(0);

  useEffect(() => {
    if (!live || !topicKey || !userId) {
      setPeers([]);
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) return;

    const ch = client.channel(`nexus-typing:${topicKey}`, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = ch;

    ch.on("broadcast", { event: "typing" }, ({ payload }) => {
      const p = payload as { userId?: string; username?: string };
      if (!p.userId || p.userId === userId) return;
      const name = p.username?.trim() || "Someone";
      setPeers((prev) => {
        const next = prev.filter((x) => x.userId !== p.userId && x.expiresAt > Date.now());
        next.push({ userId: p.userId!, username: name, expiresAt: Date.now() + TYPING_TTL_MS });
        return next;
      });
    });

    void ch.subscribe();

    const prune = window.setInterval(() => {
      setPeers((prev) => {
        const now = Date.now();
        const filtered = prev.filter((x) => x.expiresAt > now);
        return filtered.length === prev.length ? prev : filtered;
      });
    }, 800);

    return () => {
      window.clearInterval(prune);
      channelRef.current = null;
      void client.removeChannel(ch);
      setPeers([]);
    };
  }, [live, topicKey, userId]);

  const notifyTyping = useCallback(() => {
    if (!live || !topicKey || !userId || !channelRef.current) return;
    const now = Date.now();
    if (now - lastSent.current < TYPING_THROTTLE_MS) return;
    lastSent.current = now;
    void channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { userId, username: username ?? "Someone" },
    });
  }, [live, topicKey, userId, username]);

  const labels = peers.map((p) => p.username);
  return { typingNames: labels, notifyTyping };
}
