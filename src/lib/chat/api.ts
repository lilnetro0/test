import type {
  ChatMessage,
  Game,
  MemberInfo,
  Reaction,
  TextChannel,
  VoiceChannel,
} from "@/lib/mock-data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ensureProfile } from "@/lib/supabase/profile";

export type LiveHub = {
  uuid: string;
  slug: string;
  game: Game;
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

type MessageRow = {
  id: string;
  body: string;
  pinned: boolean;
  edited_at: string | null;
  created_at: string;
  author_id: string;
  reply_to: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_mime?: string | null;
  author?: { username: string } | { username: string }[] | null;
  reply?:
    | {
        body: string;
        author?: { username: string } | { username: string }[] | null;
      }
    | {
        body: string;
        author?: { username: string } | { username: string }[] | null;
      }[]
    | null;
};

function pickUsername(author: MessageRow["author"]): string {
  if (!author) return "Unknown";
  if (Array.isArray(author)) return author[0]?.username ?? "Unknown";
  return author.username ?? "Unknown";
}

function attachmentFromRow(m: MessageRow): ChatMessage["attachment"] | undefined {
  if (!m.attachment_url) return undefined;
  const mime = m.attachment_mime ?? "";
  const kind = mime.startsWith("image/") ? "image" : "file";
  return {
    name: m.attachment_name || "file",
    kind,
    meta: mime || undefined,
    url: m.attachment_url,
  };
}

export function messageRowToChat(m: MessageRow, reactions?: Reaction[]): ChatMessage {
  const reply = Array.isArray(m.reply) ? m.reply[0] : m.reply;
  const replyAuthor = reply ? pickUsername(reply.author ?? null) : undefined;
  return {
    id: m.id,
    author: pickUsername(m.author ?? null),
    authorId: m.author_id,
    time: formatTime(m.created_at),
    body: m.body,
    pinned: m.pinned,
    edited: Boolean(m.edited_at),
    replyToId: m.reply_to ?? undefined,
    replyTo: reply
      ? {
          author: replyAuthor ?? "Unknown",
          body: reply.body,
        }
      : undefined,
    attachment: attachmentFromRow(m),
    reactions,
  };
}

const MESSAGE_SELECT =
  "id, body, pinned, edited_at, created_at, author_id, reply_to, attachment_url, attachment_name, attachment_mime, author:profiles!author_id(username), reply:messages!reply_to(body, author:profiles!author_id(username))";

async function fetchReactionsForMessages(
  messageIds: string[],
  viewerId?: string,
): Promise<Map<string, Reaction[]>> {
  const map = new Map<string, Reaction[]>();
  if (!messageIds.length) return map;
  const client = getSupabaseBrowserClient();
  if (!client) return map;

  const { data, error } = await client
    .from("message_reactions")
    .select("message_id, user_id, emoji")
    .in("message_id", messageIds);

  if (error || !data) return map;

  const agg = new Map<string, Map<string, { count: number; mine: boolean }>>();
  for (const row of data) {
    let byEmoji = agg.get(row.message_id);
    if (!byEmoji) {
      byEmoji = new Map();
      agg.set(row.message_id, byEmoji);
    }
    const cur = byEmoji.get(row.emoji) ?? { count: 0, mine: false };
    cur.count += 1;
    if (viewerId && row.user_id === viewerId) cur.mine = true;
    byEmoji.set(row.emoji, cur);
  }

  for (const [mid, byEmoji] of agg) {
    map.set(
      mid,
      [...byEmoji.entries()].map(([emoji, v]) => ({
        emoji,
        count: v.count,
        mine: v.mine || undefined,
      })),
    );
  }
  return map;
}

export async function fetchLiveHubs(): Promise<{ hubs: LiveHub[]; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { hubs: [], error: "Supabase not configured" };

  const { data, error } = await client
    .from("hubs")
    .select("id, slug, name, member_count, active_count, image_url, game:games(*)")
    .order("name");

  if (error) return { hubs: [], error: error.message };

  const hubs: LiveHub[] = (data ?? []).map((h) => {
    const game = Array.isArray(h.game) ? h.game[0] : h.game;
    return {
      uuid: h.id,
      slug: h.slug,
      game: {
        id: h.slug,
        name: game?.name ?? h.name,
        short: game?.short ?? h.slug.slice(0, 3).toUpperCase(),
        hubName: h.name,
        tint: game?.tint ?? "bg-stone-500/20",
        textTint: game?.text_tint ?? "text-stone-300",
        activeCount: h.active_count,
        category: (game?.category as Game["category"]) ?? "sandbox",
        members: h.member_count,
        imageUrl: h.image_url || game?.image_url || null,
      },
    };
  });

  return { hubs };
}

export async function fetchUserHubs(
  userId: string,
): Promise<{ hubs: Game[]; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { hubs: [], error: "Supabase not configured" };

  const { data, error } = await client
    .from("hub_members")
    .select("hub:hubs(id, slug, name, member_count, active_count, image_url, game:games(*))")
    .eq("user_id", userId);

  if (error) return { hubs: [], error: error.message };

  const hubs: Game[] = [];
  for (const row of data ?? []) {
    const hub = Array.isArray(row.hub) ? row.hub[0] : row.hub;
    if (!hub) continue;
    const game = Array.isArray(hub.game) ? hub.game[0] : hub.game;
    hubs.push({
      id: hub.slug,
      name: game?.name ?? hub.name,
      short: game?.short ?? hub.slug.slice(0, 3).toUpperCase(),
      hubName: hub.name,
      tint: game?.tint ?? "bg-stone-500/20",
      textTint: game?.text_tint ?? "text-stone-300",
      activeCount: hub.active_count,
      category: (game?.category as Game["category"]) ?? "sandbox",
      members: hub.member_count,
      imageUrl: hub.image_url || game?.image_url || null,
    });
  }
  return { hubs };
}

export async function joinHub(hubUuid: string, userId: string): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const ensured = await ensureProfile(userId);
  if (!ensured.ok) {
    return {
      ok: false,
      error: ensured.error ?? "Profile missing — run supabase/01_backfill_profiles.sql",
    };
  }

  const { error } = await client.from("hub_members").upsert(
    { hub_id: hubUuid, user_id: userId, role: "member" },
    { onConflict: "hub_id,user_id" },
  );
  if (error) {
    if (error.code === "23503" || error.message.includes("hub_members_user_id_fkey")) {
      return {
        ok: false,
        error: "Profile missing in database. Run supabase/01_backfill_profiles.sql in the SQL Editor, then refresh.",
      };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function joinHubBySlug(
  slug: string,
  userId: string,
): Promise<{ ok: boolean; hubUuid?: string; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data: hub, error } = await client.from("hubs").select("id").eq("slug", slug).maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!hub) return { ok: false, error: "Hub not found in database" };

  const joined = await joinHub(hub.id, userId);
  if (!joined.ok) return joined;
  return { ok: true, hubUuid: hub.id };
}

export async function fetchChannels(hubUuid: string): Promise<{
  text: TextChannel[];
  voice: VoiceChannel[];
  error?: string;
}> {
  const client = getSupabaseBrowserClient();
  if (!client) return { text: [], voice: [], error: "Supabase not configured" };

  const [textRes, voiceRes] = await Promise.all([
    client
      .from("text_channels")
      .select("id, name, topic, position")
      .eq("hub_id", hubUuid)
      .order("position"),
    client
      .from("voice_channels")
      .select("id, name, position, livekit_room_name")
      .eq("hub_id", hubUuid)
      .order("position"),
  ]);

  if (textRes.error) return { text: [], voice: [], error: textRes.error.message };
  if (voiceRes.error) return { text: [], voice: [], error: voiceRes.error.message };

  return {
    text: (textRes.data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      topic: c.topic ?? undefined,
    })),
    voice: (voiceRes.data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      members: [],
      livekitRoomName: c.livekit_room_name ?? undefined,
    })),
  };
}

export async function fetchMessages(
  channelId: string,
  opts?: { query?: string; limit?: number; viewerId?: string },
): Promise<{ messages: ChatMessage[]; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { messages: [], error: "Supabase not configured" };

  const limit = Math.min(opts?.limit ?? 80, 150);
  let q = client
    .from("messages")
    .select(MESSAGE_SELECT)
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true })
    .limit(limit);

  const query = opts?.query?.trim();
  if (query) {
    q = q.ilike("body", `%${query}%`);
  }

  const { data, error } = await q;
  if (error) return { messages: [], error: error.message };
  const rows = (data ?? []) as MessageRow[];
  const reactions = await fetchReactionsForMessages(
    rows.map((r) => r.id),
    opts?.viewerId,
  );
  return {
    messages: rows.map((m) => messageRowToChat(m, reactions.get(m.id))),
  };
}

export async function fetchMessage(
  id: string,
  viewerId?: string,
): Promise<ChatMessage | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;
  const { data, error } = await client.from("messages").select(MESSAGE_SELECT).eq("id", id).maybeSingle();
  if (error || !data) return null;
  const reactions = await fetchReactionsForMessages([id], viewerId);
  return messageRowToChat(data as MessageRow, reactions.get(id));
}

export async function sendChannelMessage(input: {
  channelId: string;
  authorId: string;
  body: string;
  replyToId?: string;
  attachment?: { url: string; name: string; mime: string };
}): Promise<{ message: ChatMessage | null; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { message: null, error: "Supabase not configured" };

  const body = input.body.trim();
  if (!body && !input.attachment) return { message: null, error: "Empty message" };

  const { data, error } = await client
    .from("messages")
    .insert({
      channel_id: input.channelId,
      author_id: input.authorId,
      body: body || (input.attachment ? " " : ""),
      reply_to: input.replyToId ?? null,
      attachment_url: input.attachment?.url ?? null,
      attachment_name: input.attachment?.name ?? null,
      attachment_mime: input.attachment?.mime ?? null,
    })
    .select(MESSAGE_SELECT)
    .single();

  if (error || !data) return { message: null, error: error?.message ?? "Send failed" };
  return { message: messageRowToChat(data as MessageRow, []) };
}

export async function editChannelMessage(
  messageId: string,
  body: string,
): Promise<{ message: ChatMessage | null; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { message: null, error: "Supabase not configured" };
  const trimmed = body.trim();
  if (!trimmed) return { message: null, error: "Empty message" };

  const { data, error } = await client
    .from("messages")
    .update({ body: trimmed, edited_at: new Date().toISOString() })
    .eq("id", messageId)
    .select(MESSAGE_SELECT)
    .single();

  if (error || !data) return { message: null, error: error?.message ?? "Edit failed" };
  return { message: messageRowToChat(data as MessageRow) };
}

export async function toggleReaction(input: {
  messageId: string;
  userId: string;
  emoji: string;
}): Promise<{ reactions: Reaction[]; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { reactions: [], error: "Supabase not configured" };

  const { data: existing } = await client
    .from("message_reactions")
    .select("emoji")
    .eq("message_id", input.messageId)
    .eq("user_id", input.userId)
    .eq("emoji", input.emoji)
    .maybeSingle();

  if (existing) {
    const { error } = await client
      .from("message_reactions")
      .delete()
      .eq("message_id", input.messageId)
      .eq("user_id", input.userId)
      .eq("emoji", input.emoji);
    if (error) return { reactions: [], error: error.message };
  } else {
    const { error } = await client.from("message_reactions").insert({
      message_id: input.messageId,
      user_id: input.userId,
      emoji: input.emoji,
    });
    if (error) return { reactions: [], error: error.message };
  }

  const map = await fetchReactionsForMessages([input.messageId], input.userId);
  return { reactions: map.get(input.messageId) ?? [] };
}

export async function setMessagePinned(
  messageId: string,
  pinned: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { error } = await client.from("messages").update({ pinned }).eq("id", messageId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteChannelMessage(
  messageId: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { error } = await client.from("messages").delete().eq("id", messageId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function fetchHubMembers(hubUuid: string): Promise<{
  online: MemberInfo[];
  offline: MemberInfo[];
  error?: string;
}> {
  const client = getSupabaseBrowserClient();
  if (!client) return { online: [], offline: [], error: "Supabase not configured" };

  const { data, error } = await client
    .from("hub_members")
    .select("user_id, role, profile:profiles!user_id(username, tag, status, status_text)")
    .eq("hub_id", hubUuid);

  if (error) return { online: [], offline: [], error: error.message };

  const online: MemberInfo[] = [];
  const offline: MemberInfo[] = [];

  for (const row of data ?? []) {
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    if (!profile) continue;
    const info: MemberInfo = {
      name: profile.username,
      tag: `#${profile.tag}`,
      role: row.role as MemberInfo["role"],
      status: profile.status_text || profile.status,
      userId: row.user_id,
    };
    if (profile.status === "offline") offline.push(info);
    else online.push(info);
  }

  return { online, offline };
}
