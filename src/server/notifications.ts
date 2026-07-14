import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { NotificationDto } from "@/lib/supabase/dto";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export const listNotifications = createServerFn({ method: "GET" })
  .validator((data: { accessToken: string }) => data)
  .handler(async ({ data }): Promise<{ notifications: NotificationDto[]; error?: string }> => {
    const client = getSupabaseServerClient(data.accessToken);
    if (!client) return { notifications: [], error: "Supabase not configured" };

    const { data: userData, error: userError } = await client.auth.getUser(data.accessToken);
    if (userError || !userData.user) return { notifications: [], error: "Not authenticated" };

    const { data: rows, error } = await client
      .from("notifications")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return { notifications: [], error: error.message };

    return {
      notifications: (rows ?? []).map((n) => ({
        id: n.id,
        kind: n.kind,
        title: n.title,
        body: n.body,
        time: relativeTime(n.created_at),
        read: Boolean(n.read_at),
        href: n.href ?? undefined,
      })),
    };
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; ids?: string[] }) => data)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const client = getSupabaseServerClient(data.accessToken);
    if (!client) return { ok: false, error: "Supabase not configured" };

    const { data: userData, error: userError } = await client.auth.getUser(data.accessToken);
    if (userError || !userData.user) return { ok: false, error: "Not authenticated" };

    const now = new Date().toISOString();
    let query = client
      .from("notifications")
      .update({ read_at: now })
      .eq("user_id", userData.user.id)
      .is("read_at", null);

    if (data.ids?.length) {
      query = query.in("id", data.ids);
    }

    const { error } = await query;
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });
