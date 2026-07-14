import type { NotificationItem } from "@/lib/mock-data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

type NotificationRow = {
  id: string;
  kind: string;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

function rowToItem(n: NotificationRow): NotificationItem {
  const kind =
    n.kind === "mention" ||
    n.kind === "friend" ||
    n.kind === "voice" ||
    n.kind === "system" ||
    n.kind === "dm"
      ? n.kind
      : "system";
  return {
    id: n.id,
    kind,
    title: n.title,
    body: n.body,
    time: relativeTime(n.created_at),
    read: Boolean(n.read_at),
    href: n.href ?? undefined,
  };
}

export async function fetchNotifications(userId: string): Promise<{
  items: NotificationItem[];
  error?: string;
}> {
  const client = getSupabaseBrowserClient();
  if (!client) return { items: [], error: "Supabase not configured" };

  const { data, error } = await client
    .from("notifications")
    .select("id, kind, title, body, href, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) return { items: [], error: error.message };
  return { items: (data ?? []).map((n) => rowToItem(n as NotificationRow)) };
}

export async function fetchNotification(id: string): Promise<NotificationItem | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;
  const { data, error } = await client
    .from("notifications")
    .select("id, kind, title, body, href, read_at, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return rowToItem(data as NotificationRow);
}

export async function markNotificationsRead(
  userId: string,
  ids?: string[],
): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const now = new Date().toISOString();
  let q = client
    .from("notifications")
    .update({ read_at: now })
    .eq("user_id", userId)
    .is("read_at", null);

  if (ids?.length) q = q.in("id", ids);

  const { error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
