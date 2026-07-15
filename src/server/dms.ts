import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { DmThreadDto, MessageDto } from "@/lib/supabase/dto";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export const listDmThreads = createServerFn({ method: "GET" })
  .validator((data: { accessToken: string }) => data)
  .handler(async ({ data }): Promise<{ threads: DmThreadDto[]; error?: string }> => {
    const client = getSupabaseServerClient(data.accessToken);
    if (!client) return { threads: [], error: "Supabase not configured" };

    const { data: userData, error: userError } = await client.auth.getUser(data.accessToken);
    if (userError || !userData.user) return { threads: [], error: "Not authenticated" };

    const uid = userData.user.id;
    const { data: parts, error } = await client
      .from("dm_participants")
      .select("thread_id")
      .eq("user_id", uid);

    if (error) return { threads: [], error: error.message };
    const threadIds = (parts ?? []).map((p) => p.thread_id);
    if (threadIds.length === 0) return { threads: [] };

    const threads: DmThreadDto[] = [];
    for (const threadId of threadIds) {
      const { data: others } = await client
        .from("dm_participants")
        .select("user_id, profile:profiles!user_id(id, username, tag, status, status_text)")
        .eq("thread_id", threadId)
        .neq("user_id", uid)
        .limit(1);

      const other = others?.[0];
      const profile = other
        ? Array.isArray(other.profile)
          ? other.profile[0]
          : other.profile
        : null;

      const { data: last } = await client
        .from("dm_messages")
        .select("body, created_at")
        .eq("thread_id", threadId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: unreadCount } = await client.rpc("dm_thread_unread", {
        p_thread_id: threadId,
      });

      threads.push({
        id: threadId,
        with: {
          id: profile?.id ?? "",
          name: profile?.username ?? "Unknown",
          tag: profile ? `#${profile.tag}` : "#0000",
          status: (profile?.status as DmThreadDto["with"]["status"]) ?? "offline",
          activity: profile?.status_text || undefined,
        },
        lastMessage: last?.body ?? "",
        lastTime: last ? formatTime(last.created_at) : "",
        unread: Math.min(Number(unreadCount) || 0, 99),
        messages: [],
      });
    }

    return { threads };
  });

export const sendDm = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; threadId: string; body: string }) => data)
  .handler(async ({ data }): Promise<{ message: MessageDto | null; error?: string }> => {
    const client = getSupabaseServerClient(data.accessToken);
    if (!client) return { message: null, error: "Supabase not configured" };

    const { data: userData, error: userError } = await client.auth.getUser(data.accessToken);
    if (userError || !userData.user) return { message: null, error: "Not authenticated" };

    const body = data.body.trim();
    if (!body) return { message: null, error: "Empty message" };

    const { data: row, error } = await client
      .from("dm_messages")
      .insert({
        thread_id: data.threadId,
        author_id: userData.user.id,
        body,
      })
      .select("id, body, created_at, author_id")
      .single();

    if (error || !row) return { message: null, error: error?.message ?? "Insert failed" };

    await client.from("dm_threads").update({ updated_at: new Date().toISOString() }).eq("id", data.threadId);

    const { data: profile } = await client
      .from("profiles")
      .select("username")
      .eq("id", userData.user.id)
      .maybeSingle();

    return {
      message: {
        id: row.id,
        author: profile?.username ?? "You",
        authorId: row.author_id,
        time: formatTime(row.created_at),
        body: row.body,
      },
    };
  });
