import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { shouldUseMockData } from "@/lib/supabase/env";
import { useAuth } from "@/lib/auth-provider";

/** Channel + DM message unreads for dock badges (separate from notification unread). */
export function useMessageUnreadTotals(pollMs = 45_000) {
  const live = !shouldUseMockData();
  const { user } = useAuth();
  const [channelUnread, setChannelUnread] = useState(0);
  const [dmUnread, setDmUnread] = useState(0);

  const refresh = useCallback(async () => {
    if (!live || !user) {
      setChannelUnread(0);
      setDmUnread(0);
      return;
    }
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const { data, error } = await client.rpc("user_message_unread_totals");
    if (error || !data) return;
    const row = Array.isArray(data) ? data[0] : data;
    setChannelUnread(Math.min(Number(row?.channel_unread) || 0, 99));
    setDmUnread(Math.min(Number(row?.dm_unread) || 0, 99));
  }, [live, user]);

  useEffect(() => {
    void refresh();
    if (!live || !user) return;
    const id = window.setInterval(() => void refresh(), pollMs);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("nexus:unread-refresh", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("nexus:unread-refresh", onFocus);
    };
  }, [live, user, pollMs, refresh]);

  return { channelUnread, dmUnread, refreshMessageUnreads: refresh };
}

export function bumpMessageUnreadRefresh() {
  window.dispatchEvent(new Event("nexus:unread-refresh"));
}
