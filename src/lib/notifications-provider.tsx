import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { NOTIFICATIONS, type NotificationItem } from "@/lib/mock-data";
import { shouldUseMockData } from "@/lib/supabase/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-provider";
import {
  fetchNotification,
  fetchNotifications,
  markNotificationsRead,
} from "@/lib/notifications/api";
import { toast } from "sonner";

type NotificationsContextValue = {
  live: boolean;
  loading: boolean;
  items: NotificationItem[];
  unreadCount: number;
  refresh: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const live = !shouldUseMockData();
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>(() => (live ? [] : NOTIFICATIONS));
  const [loading, setLoading] = useState(live);

  const refresh = useCallback(async () => {
    if (!live) {
      setItems(NOTIFICATIONS);
      setLoading(false);
      return;
    }
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { items: next, error } = await fetchNotifications(user.id);
    if (error) toast.error(error);
    setItems(next);
    setLoading(false);
  }, [live, user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Realtime inserts + updates for this user
  useEffect(() => {
    if (!live || !user) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;

    const topic = client
      .channel(`nexus-notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const id = (payload.new as { id: string }).id;
          void fetchNotification(id).then((item) => {
            if (!item) return;
            setItems((prev) => (prev.some((n) => n.id === item.id) ? prev : [item, ...prev]));
            // Skip toast when already on that surface (active DM / friends / inbox).
            const path = typeof window !== "undefined" ? window.location.pathname : "";
            const href = item.href ?? "";
            const onDm = path.startsWith("/dm") && (item.kind === "dm" || href.startsWith("/dm"));
            const onFriends =
              path.startsWith("/friends") && (item.kind === "friend" || href.startsWith("/friends"));
            const onInbox = path.startsWith("/notifications");
            if (!onDm && !onFriends && !onInbox) {
              toast(item.title, { description: item.body.slice(0, 80) });
            }
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const id = (payload.new as { id: string }).id;
          void fetchNotification(id).then((item) => {
            if (!item) return;
            setItems((prev) => prev.map((n) => (n.id === item.id ? item : n)));
          });
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(topic);
    };
  }, [live, user?.id]);

  const markAllRead = useCallback(async () => {
    if (!live) {
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      return;
    }
    if (!user) return;
    const result = await markNotificationsRead(user.id);
    if (!result.ok) {
      toast.error(result.error ?? "Could not mark read");
      return;
    }
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [live, user]);

  const markRead = useCallback(
    async (id: string) => {
      if (!live) {
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        return;
      }
      if (!user) return;
      const result = await markNotificationsRead(user.id, [id]);
      if (!result.ok) return;
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    },
    [live, user],
  );

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items],
  );

  const value = useMemo<NotificationsContextValue>(
    () => ({
      live,
      loading,
      items,
      unreadCount,
      refresh,
      markAllRead,
      markRead,
    }),
    [live, loading, items, unreadCount, refresh, markAllRead, markRead],
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within <NotificationsProvider>");
  return ctx;
}
