import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { MessageDto } from "@/lib/supabase/dto";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export const listMessages = createServerFn({ method: "GET" })
  .validator((data: { accessToken: string; channelId: string; limit?: number; before?: string }) => data)
  .handler(async ({ data }): Promise<{ messages: MessageDto[]; hasMore?: boolean; error?: string }> => {
    const client = getSupabaseServerClient(data.accessToken);
    if (!client) return { messages: [], error: "Supabase not configured" };

    const limit = Math.min(data.limit ?? 50, 100);
    let q = client
      .from("messages")
      .select("id, body, pinned, edited_at, created_at, author_id, author:profiles!author_id(username), reply:messages!reply_to(body, author:profiles!author_id(username))")
      .eq("channel_id", data.channelId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (data.before) {
      q = q.lt("created_at", data.before);
    }

    const { data: raw, error } = await q;

    if (error) return { messages: [], error: error.message };

    const rows = (raw ?? []).slice().reverse();
    const messages: MessageDto[] = rows.map((m) => {
      const author = Array.isArray(m.author) ? m.author[0] : m.author;
      const reply = Array.isArray(m.reply) ? m.reply[0] : m.reply;
      const replyAuthor = reply
        ? Array.isArray((reply as { author?: unknown }).author)
          ? (reply as { author: { username: string }[] }).author[0]
          : (reply as { author?: { username: string } }).author
        : undefined;

      return {
        id: m.id,
        author: author?.username ?? "Unknown",
        authorId: m.author_id,
        time: formatTime(m.created_at),
        body: m.body,
        pinned: m.pinned,
        edited: Boolean(m.edited_at),
        replyTo: reply
          ? {
              author: replyAuthor?.username ?? "Unknown",
              body: (reply as { body: string }).body,
            }
          : undefined,
      };
    });

    return { messages, hasMore: rows.length >= limit };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .validator(
    (data: { accessToken: string; channelId: string; body: string; replyTo?: string }) => data,
  )
  .handler(async ({ data }): Promise<{ message: MessageDto | null; error?: string }> => {
    const client = getSupabaseServerClient(data.accessToken);
    if (!client) return { message: null, error: "Supabase not configured" };

    const { data: userData, error: userError } = await client.auth.getUser(data.accessToken);
    if (userError || !userData.user) return { message: null, error: "Not authenticated" };

    const body = data.body.trim();
    if (!body) return { message: null, error: "Empty message" };

    const { data: row, error } = await client
      .from("messages")
      .insert({
        channel_id: data.channelId,
        author_id: userData.user.id,
        body,
        reply_to: data.replyTo ?? null,
      })
      .select("id, body, pinned, edited_at, created_at, author_id")
      .single();

    if (error || !row) return { message: null, error: error?.message ?? "Insert failed" };

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
        pinned: row.pinned,
        edited: Boolean(row.edited_at),
      },
    };
  });
