import type {
  HubCard,
  ChatMessage,
  MemberInfo,
  Reaction,
  TextChannel,
  VoiceChannel,
} from "@/lib/mock-data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ensureProfile } from "@/lib/supabase/profile";
import { withMappedDbError } from "@/lib/rate-limit";

export type LiveHub = {
  uuid: string;
  slug: string;
  /** Catalog `games.id` */
  gameId: string;
  game: HubCard;
};

type HubJoinRow = {
  id: string;
  slug: string;
  name: string;
  member_count: number;
  active_count: string;
  image_url?: string | null;
  game?:
    | {
        id: string;
        name: string;
        short: string;
        category: string;
        tint: string;
        text_tint: string;
        image_url?: string | null;
      }
    | {
        id: string;
        name: string;
        short: string;
        category: string;
        tint: string;
        text_tint: string;
        image_url?: string | null;
      }[]
    | null;
};

/** Map DB hub ⊕ game → UI card. `HubCard.id` = hub slug; `HubCard.gameId` = catalog id. */
export function mapHubRowToLiveHub(h: HubJoinRow): LiveHub {
  const game = Array.isArray(h.game) ? h.game[0] : h.game;
  const gameId = game?.id ?? h.slug;
  return {
    uuid: h.id,
    slug: h.slug,
    gameId,
    game: {
      id: h.slug,
      gameId,
      hubUuid: h.id,
      name: game?.name ?? h.name,
      short: game?.short ?? h.slug.slice(0, 3).toUpperCase(),
      hubName: h.name,
      tint: game?.tint ?? "bg-stone-500/20",
      textTint: game?.text_tint ?? "text-stone-300",
      activeCount: h.active_count,
      category: (game?.category as HubCard["category"]) ?? "sandbox",
      members: h.member_count,
      imageUrl: h.image_url || game?.image_url || null,
    },
  };
}

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
    createdAt: m.created_at,
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

  const hubs: LiveHub[] = (data ?? []).map((h) => mapHubRowToLiveHub(h as HubJoinRow));

  return { hubs };
}

export async function fetchUserHubs(
  userId: string,
): Promise<{ hubs: HubCard[]; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { hubs: [], error: "Supabase not configured" };

  const { data, error } = await client
    .from("hub_members")
    .select("hub:hubs(id, slug, name, member_count, active_count, image_url, game:games(*))")
    .eq("user_id", userId);

  if (error) return { hubs: [], error: error.message };

  const hubs: HubCard[] = [];
  for (const row of data ?? []) {
    const hub = Array.isArray(row.hub) ? row.hub[0] : row.hub;
    if (!hub) continue;
    hubs.push(mapHubRowToLiveHub(hub as HubJoinRow).game);
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
      error: ensured.error ?? "Profile missing — run supabase/manual/01_backfill_profiles.sql (see docs/DATABASE-OPERATIONS.md)",
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
        error: "Profile missing in database. Run supabase/manual/01_backfill_profiles.sql, then refresh. See docs/DATABASE-OPERATIONS.md.",
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

  const { data: unreadRows } = await client.rpc("hub_channel_unreads", { p_hub_id: hubUuid });
  const unreadMap = new Map<string, number>();
  for (const row of unreadRows ?? []) {
    unreadMap.set(row.channel_id, Number(row.unread) || 0);
  }

  return {
    text: (textRes.data ?? []).map((c) => {
      const n = unreadMap.get(c.id) ?? 0;
      return {
        id: c.id,
        name: c.name,
        topic: c.topic ?? undefined,
        unread: n > 0 ? Math.min(n, 99) : undefined,
      };
    }),
    voice: (voiceRes.data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      members: [],
      livekitRoomName: c.livekit_room_name ?? undefined,
    })),
  };
}

export async function markChannelRead(
  channelId: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { error } = await client.rpc("mark_channel_read", { p_channel_id: channelId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function refreshHubActiveCount(
  hubUuid: string,
): Promise<{ activeCount?: string; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { error: "Supabase not configured" };
  const { data, error } = await client.rpc("refresh_hub_active_count", { p_hub_id: hubUuid });
  if (error) return { error: error.message };
  return { activeCount: typeof data === "string" ? data : String(data ?? "0") };
}

export async function fetchMessages(
  channelId: string,
  opts?: {
    query?: string;
    limit?: number;
    viewerId?: string;
    /** ISO created_at — load messages strictly older than this (pagination). */
    before?: string;
  },
): Promise<{ messages: ChatMessage[]; hasMore?: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { messages: [], error: "Supabase not configured" };

  const limit = Math.min(opts?.limit ?? 80, 150);
  // Latest N (or page before cursor), then reverse for chronological UI.
  let q = client
    .from("messages")
    .select(MESSAGE_SELECT)
    .eq("channel_id", channelId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (opts?.before) {
    q = q.lt("created_at", opts.before);
  }

  const query = opts?.query?.trim();
  if (query) {
    // Fold diacritics/tatweel for better Arabic recall; store still holds original text.
    const { normalizeArabicForSearch } = await import("@/lib/arabic-normalize");
    const folded = normalizeArabicForSearch(query);
    q = q.ilike("body", `%${folded || query}%`);
  }

  const { data, error } = await q;
  if (error) return { messages: [], error: error.message };
  const rows = ((data ?? []) as unknown as MessageRow[]).slice().reverse();
  const reactions = await fetchReactionsForMessages(
    rows.map((r) => r.id),
    opts?.viewerId,
  );
  return {
    messages: rows.map((m) => messageRowToChat(m, reactions.get(m.id))),
    hasMore: rows.length >= limit,
  };
}

export async function fetchMessageEdits(
  messageId: string,
): Promise<{ edits: { id: string; previousBody: string; editorId: string; createdAt: string }[]; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { edits: [], error: "Supabase not configured" };

  const { data, error } = await client
    .from("message_edits")
    .select("id, previous_body, editor_id, created_at")
    .eq("message_id", messageId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return { edits: [], error: error.message };
  return {
    edits: (data ?? []).map((e) => ({
      id: e.id,
      previousBody: e.previous_body,
      editorId: e.editor_id,
      createdAt: e.created_at,
    })),
  };
}

export async function fetchMessage(
  id: string,
  viewerId?: string,
): Promise<ChatMessage | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;
  const { data, error } = await client
    .from("messages")
    .select(MESSAGE_SELECT)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) return null;
  const reactions = await fetchReactionsForMessages([id], viewerId);
  return messageRowToChat(data as unknown as MessageRow, reactions.get(id));
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

  if (error || !data) return { message: null, error: withMappedDbError(error?.message, "Send failed") };
  return { message: messageRowToChat(data as unknown as MessageRow, []) };
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
    .is("deleted_at", null)
    .select(MESSAGE_SELECT)
    .single();

  if (error || !data) return { message: null, error: withMappedDbError(error?.message, "Edit failed") };
  return { message: messageRowToChat(data as unknown as MessageRow) };
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
    if (error) return { reactions: [], error: withMappedDbError(error.message, "Could not update reaction") };
  } else {
    const { error } = await client.from("message_reactions").insert({
      message_id: input.messageId,
      user_id: input.userId,
      emoji: input.emoji,
    });
    if (error) return { reactions: [], error: withMappedDbError(error.message, "Could not update reaction") };
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
  const { error } = await client.rpc("soft_delete_message", {
    p_message_id: messageId,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function kickHubMember(
  hubUuid: string,
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { error } = await client.rpc("hub_kick_member", {
    p_hub_id: hubUuid,
    p_user_id: userId,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function setHubMemberRole(
  hubUuid: string,
  userId: string,
  role: "admin" | "mod" | "member",
): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { error } = await client.rpc("hub_set_member_role", {
    p_hub_id: hubUuid,
    p_user_id: userId,
    p_role: role,
  });
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

  const { data, error } = await client.rpc("list_hub_members_visible", {
    p_hub_id: hubUuid,
  });

  if (error) {
    // Fallback for projects that have not applied the Phase 9 follow-up migration yet.
    const legacy = await client
      .from("hub_members")
      .select("user_id, role, profile:profiles!user_id(username, tag, status, status_text)")
      .eq("hub_id", hubUuid);
    if (legacy.error) return { online: [], offline: [], error: legacy.error.message };

    const online: MemberInfo[] = [];
    const offline: MemberInfo[] = [];
    for (const row of legacy.data ?? []) {
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

  const online: MemberInfo[] = [];
  const offline: MemberInfo[] = [];

  for (const row of data ?? []) {
    const info: MemberInfo = {
      name: row.username,
      tag: `#${row.tag}`,
      role: row.role as MemberInfo["role"],
      status: row.status_text || row.status,
      userId: row.user_id,
    };
    if (row.status === "offline") offline.push(info);
    else online.push(info);
  }

  return { online, offline };
}
