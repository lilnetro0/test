import { useCallback, useEffect, useState } from "react";
import { FRIENDS, FRIEND_REQUESTS, type Friend } from "@/lib/mock-data";
import { shouldUseMockData } from "@/lib/supabase/env";
import { useAuth } from "@/lib/auth-provider";
import {
  acceptFriendRequest,
  blockUser,
  declineFriendRequest,
  fetchBlocked,
  fetchFriends,
  fetchPendingRequests,
  openDmWith,
  sendFriendRequestByTag,
  unblockUser,
  type PendingRequest,
} from "@/lib/social/api";

export function useFriends() {
  const live = !shouldUseMockData();
  const { user } = useAuth();

  const [friends, setFriends] = useState<Friend[]>(() => (live ? [] : FRIENDS));
  const [incoming, setIncoming] = useState<PendingRequest[]>(() =>
    live
      ? []
      : FRIEND_REQUESTS.map((f, i) => ({
          ...f,
          requestId: `mock-${i}`,
          incoming: true,
        })),
  );
  const [blocked, setBlocked] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(live);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!live) {
      setFriends(FRIENDS);
      setIncoming(
        FRIEND_REQUESTS.map((f, i) => ({
          ...f,
          requestId: `mock-${i}`,
          incoming: true,
        })),
      );
      setBlocked([]);
      setLoading(false);
      return;
    }
    if (!user) {
      setFriends([]);
      setIncoming([]);
      setBlocked([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [f, p, b] = await Promise.all([
      fetchFriends(user.id),
      fetchPendingRequests(user.id),
      fetchBlocked(user.id),
    ]);
    if (f.error || p.error || b.error) {
      setError(f.error ?? p.error ?? b.error ?? "Load failed");
    } else {
      setError(null);
    }
    setFriends(f.friends);
    setIncoming(p.incoming);
    setBlocked(b.blocked);
    setLoading(false);
  }, [live, user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sendRequest = useCallback(
    async (usernameTag: string) => {
      if (!live) return { ok: true as const };
      if (!user) return { ok: false as const, error: "Sign in required" };
      const result = await sendFriendRequestByTag(user.id, usernameTag);
      if (result.ok) await refresh();
      return result;
    },
    [live, user, refresh],
  );

  const accept = useCallback(
    async (requestId: string) => {
      if (!live) return { ok: true as const };
      const result = await acceptFriendRequest(requestId);
      if (result.ok) await refresh();
      return result;
    },
    [live, refresh],
  );

  const decline = useCallback(
    async (requestId: string) => {
      if (!live) return { ok: true as const };
      const result = await declineFriendRequest(requestId);
      if (result.ok) await refresh();
      return result;
    },
    [live, refresh],
  );

  const block = useCallback(
    async (friendId: string) => {
      if (!live) return { ok: true as const };
      if (!user) return { ok: false as const, error: "Sign in required" };
      const result = await blockUser(user.id, friendId);
      if (result.ok) await refresh();
      return result;
    },
    [live, user, refresh],
  );

  const unblock = useCallback(
    async (friendId: string) => {
      if (!live) return { ok: true as const };
      if (!user) return { ok: false as const, error: "Sign in required" };
      const result = await unblockUser(user.id, friendId);
      if (result.ok) await refresh();
      return result;
    },
    [live, user, refresh],
  );

  const startDm = useCallback(
    async (friendId: string) => {
      if (!live) return { ok: true as const, threadId: undefined as string | undefined };
      const result = await openDmWith(friendId);
      if (result.error || !result.threadId) {
        return { ok: false as const, error: result.error ?? "Could not open DM" };
      }
      return { ok: true as const, threadId: result.threadId };
    },
    [live],
  );

  return {
    live,
    loading,
    error,
    friends,
    incoming,
    blocked,
    refresh,
    sendRequest,
    accept,
    decline,
    block,
    unblock,
    startDm,
  };
}
