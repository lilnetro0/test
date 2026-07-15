import type { ChatMessage, Friend, DMConversation } from "@/lib/mock-data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ensureProfile } from "@/lib/supabase/profile";
import { withMappedDbError } from "@/lib/rate-limit";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function mapStatus(raw: string | null | undefined): Friend["status"] {
  if (raw === "online" || raw === "idle" || raw === "dnd" || raw === "offline") return raw;
  return "offline";
}

function profileToFriend(p: {
  id: string;
  username: string;
  tag: string;
  status: string;
  status_text?: string | null;
}): Friend {
  return {
    id: p.id,
    name: p.username,
    tag: `#${p.tag}`,
    status: mapStatus(p.status),
    activity: p.status_text || undefined,
  };
}

/** Parse `Username#1234` (hash optional). */
export function parseUsernameTag(raw: string): { username: string; tag: string } | null {
  const trimmed = raw.trim();
  const m = trimmed.match(/^([A-Za-z0-9_]{2,32})#?(\d{4})$/);
  if (!m) return null;
  return { username: m[1], tag: m[2] };
}

export type PublicProfile = {
  id: string;
  username: string;
  tag: string;
  displayName: string | null;
  bio: string;
  status: Friend["status"];
  statusText: string;
};

/** Lookup by username, or Username#tag when present. */
export async function fetchProfileByUsername(
  rawUsername: string,
): Promise<{ profile: PublicProfile | null; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { profile: null, error: "Supabase not configured" };

  const decoded = decodeURIComponent(rawUsername).trim();
  const withTag = parseUsernameTag(decoded);
  let query = client
    .from("profiles")
    .select("id, username, tag, display_name, bio, status, status_text");

  if (withTag) {
    query = query.eq("username", withTag.username).eq("tag", withTag.tag);
  } else {
    const username = decoded.replace(/^@/, "").split("#")[0];
    if (!username || username.length < 2) {
      return { profile: null, error: "Invalid username" };
    }
    query = query.ilike("username", username);
  }

  const { data, error } = await query.limit(1);
  if (error) return { profile: null, error: error.message };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { profile: null };

  return {
    profile: {
      id: row.id,
      username: row.username,
      tag: row.tag,
      displayName: row.display_name,
      bio: row.bio ?? "",
      status: mapStatus(row.status),
      statusText: row.status_text ?? "",
    },
  };
}

export async function fetchFriends(userId: string): Promise<{ friends: Friend[]; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { friends: [], error: "Supabase not configured" };

  const { data: rows, error } = await client
    .from("friendships")
    .select("friend_id")
    .eq("user_id", userId);

  if (error) return { friends: [], error: error.message };
  const ids = (rows ?? []).map((r) => r.friend_id);
  if (!ids.length) return { friends: [] };

  const { data: profiles, error: pErr } = await client
    .from("profiles")
    .select("id, username, tag, status, status_text")
    .in("id", ids);

  if (pErr) return { friends: [], error: pErr.message };
  return { friends: (profiles ?? []).map(profileToFriend) };
}

export type PendingRequest = Friend & { requestId: string; incoming: boolean };

export async function fetchPendingRequests(
  userId: string,
): Promise<{ incoming: PendingRequest[]; outgoing: PendingRequest[]; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { incoming: [], outgoing: [], error: "Supabase not configured" };

  const { data, error } = await client
    .from("friend_requests")
    .select(
      "id, from_user_id, to_user_id, status, from:profiles!from_user_id(id, username, tag, status, status_text), to:profiles!to_user_id(id, username, tag, status, status_text)",
    )
    .eq("status", "pending")
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);

  if (error) return { incoming: [], outgoing: [], error: error.message };

  const incoming: PendingRequest[] = [];
  const outgoing: PendingRequest[] = [];

  for (const row of data ?? []) {
    const from = Array.isArray(row.from) ? row.from[0] : row.from;
    const to = Array.isArray(row.to) ? row.to[0] : row.to;
    if (row.to_user_id === userId && from) {
      incoming.push({
        ...profileToFriend(from),
        requestId: row.id,
        incoming: true,
        activity: "Incoming request",
      });
    } else if (row.from_user_id === userId && to) {
      outgoing.push({
        ...profileToFriend(to),
        requestId: row.id,
        incoming: false,
        activity: "Outgoing request",
      });
    }
  }

  return { incoming, outgoing };
}

export async function fetchBlocked(userId: string): Promise<{ blocked: Friend[]; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { blocked: [], error: "Supabase not configured" };

  const { data, error } = await client
    .from("blocks")
    .select("blocked_id, profile:profiles!blocked_id(id, username, tag, status, status_text)")
    .eq("blocker_id", userId);

  if (error) return { blocked: [], error: error.message };

  const blocked: Friend[] = [];
  for (const row of data ?? []) {
    const p = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    if (p) blocked.push(profileToFriend(p));
  }
  return { blocked };
}

export async function sendFriendRequestByTag(
  fromUserId: string,
  usernameTag: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  await ensureProfile(fromUserId);

  const parsed = parseUsernameTag(usernameTag);
  if (!parsed) return { ok: false, error: "Use Username#1234 format" };

  const { data: target, error: findErr } = await client
    .from("profiles")
    .select("id")
    .eq("username", parsed.username)
    .eq("tag", parsed.tag)
    .maybeSingle();

  if (findErr) return { ok: false, error: findErr.message };
  if (!target) return { ok: false, error: "Player not found" };
  if (target.id === fromUserId) return { ok: false, error: "You can't friend yourself" };

  const { data: existingFriendship } = await client
    .from("friendships")
    .select("friend_id")
    .eq("user_id", fromUserId)
    .eq("friend_id", target.id)
    .maybeSingle();
  if (existingFriendship) return { ok: false, error: "Already friends" };

  const { error } = await client.from("friend_requests").insert({
    from_user_id: fromUserId,
    to_user_id: target.id,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") return { ok: false, error: "Request already sent" };
    return { ok: false, error: withMappedDbError(error.message, "Could not send request") };
  }
  return { ok: true };
}

export async function acceptFriendRequest(requestId: string): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { error } = await client.rpc("accept_friend_request", { p_request_id: requestId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function declineFriendRequest(requestId: string): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { error } = await client.rpc("decline_friend_request", { p_request_id: requestId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function removeFriend(friendId: string): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { error } = await client.rpc("remove_friend", { p_friend_id: friendId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function blockUser(
  blockerId: string,
  blockedId: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: false, error: "Supabase not configured" };
  await ensureProfile(blockerId);
  await removeFriend(blockedId);
  const { error } = await client.from("blocks").upsert(
    { blocker_id: blockerId, blocked_id: blockedId },
    { onConflict: "blocker_id,blocked_id" },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function unblockUser(
  blockerId: string,
  blockedId: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { error } = await client
    .from("blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function submitReport(input: {
  reporterId: string;
  targetUserId?: string;
  messageId?: string;
  dmMessageId?: string;
  reason: string;
  details?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  await ensureProfile(input.reporterId);

  if (!input.targetUserId && !input.messageId && !input.dmMessageId) {
    return { ok: false, error: "Nothing to report" };
  }

  if (input.targetUserId && input.targetUserId === input.reporterId) {
    return { ok: false, error: "You cannot report yourself" };
  }

  const { error } = await client.from("reports").insert({
    reporter_id: input.reporterId,
    target_user_id: input.targetUserId ?? null,
    message_id: input.messageId ?? null,
    dm_message_id: input.dmMessageId ?? null,
    reason: input.reason.slice(0, 64),
    details: (input.details ?? "").slice(0, 2000),
    status: "open",
  });

  if (error) return { ok: false, error: withMappedDbError(error.message, "Could not submit report") };
  return { ok: true };
}

export async function openDmWith(
  otherUserId: string,
): Promise<{ threadId?: string; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { error: "Supabase not configured" };
  const { data, error } = await client.rpc("get_or_create_dm_thread", {
    p_other_user_id: otherUserId,
  });
  if (error) return { error: error.message };
  return { threadId: String(data) };
}

type DmMessageRow = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_mime?: string | null;
  author?: { username: string } | { username: string }[] | null;
};

function dmRowToMessage(m: DmMessageRow): ChatMessage {
  const author = Array.isArray(m.author) ? m.author[0] : m.author;
  const mime = m.attachment_mime ?? "";
  return {
    id: m.id,
    author: author?.username ?? "Unknown",
    authorId: m.author_id,
    time: formatTime(m.created_at),
    createdAt: m.created_at,
    body: m.body,
    attachment: m.attachment_url
      ? {
          name: m.attachment_name || "file",
          kind: mime.startsWith("image/") ? "image" : "file",
          meta: mime || undefined,
          url: m.attachment_url,
        }
      : undefined,
  };
}

const DM_SELECT =
  "id, body, created_at, author_id, attachment_url, attachment_name, attachment_mime, author:profiles!author_id(username)";

export async function fetchDmThreads(userId: string): Promise<{
  threads: DMConversation[];
  error?: string;
}> {
  const client = getSupabaseBrowserClient();
  if (!client) return { threads: [], error: "Supabase not configured" };

  const { data: parts, error } = await client
    .from("dm_participants")
    .select("thread_id")
    .eq("user_id", userId);

  if (error) return { threads: [], error: error.message };
  const threadIds = (parts ?? []).map((p) => p.thread_id);
  if (!threadIds.length) return { threads: [] };

  const { data: threadsMeta } = await client
    .from("dm_threads")
    .select("id, updated_at")
    .in("id", threadIds)
    .order("updated_at", { ascending: false });

  const ordered = threadsMeta ?? threadIds.map((id) => ({ id, updated_at: "" }));
  const threads: DMConversation[] = [];

  for (const t of ordered) {
    const { data: others } = await client
      .from("dm_participants")
      .select("user_id, profile:profiles!user_id(id, username, tag, status, status_text)")
      .eq("thread_id", t.id)
      .neq("user_id", userId)
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
      .eq("thread_id", t.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: unreadCount } = await client.rpc("dm_thread_unread", {
      p_thread_id: t.id,
    });

    threads.push({
      id: t.id,
      with: profile
        ? profileToFriend(profile)
        : { id: "", name: "Unknown", tag: "#0000", status: "offline" },
      lastMessage: last?.body ?? "",
      lastTime: last ? formatTime(last.created_at) : "",
      unread: Math.min(Number(unreadCount) || 0, 99),
      messages: [],
    });
  }

  return { threads };
}

export async function fetchDmMessages(
  threadId: string,
  opts?: { limit?: number; before?: string },
): Promise<{ messages: ChatMessage[]; hasMore?: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { messages: [], error: "Supabase not configured" };

  const limit = Math.min(opts?.limit ?? 80, 150);
  let q = client
    .from("dm_messages")
    .select(DM_SELECT)
    .eq("thread_id", threadId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (opts?.before) {
    q = q.lt("created_at", opts.before);
  }

  const { data, error } = await q;
  if (error) return { messages: [], error: error.message };
  const rows = ((data ?? []) as unknown as DmMessageRow[]).slice().reverse();
  return {
    messages: rows.map((m) => dmRowToMessage(m)),
    hasMore: rows.length >= limit,
  };
}

export async function fetchDmMessage(id: string): Promise<ChatMessage | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;
  const { data, error } = await client
    .from("dm_messages")
    .select(DM_SELECT)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) return null;
  return dmRowToMessage(data as unknown as DmMessageRow);
}

export async function deleteDmMessage(
  messageId: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { error } = await client.rpc("soft_delete_dm_message", {
    p_message_id: messageId,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function markDmRead(
  threadId: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { error } = await client.rpc("mark_dm_read", { p_thread_id: threadId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function sendDmMessage(input: {
  threadId: string;
  authorId: string;
  body: string;
  attachment?: { url: string; name: string; mime: string };
}): Promise<{ message: ChatMessage | null; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { message: null, error: "Supabase not configured" };

  const body = input.body.trim();
  if (!body && !input.attachment) return { message: null, error: "Empty message" };

  await ensureProfile(input.authorId);

  const { data, error } = await client
    .from("dm_messages")
    .insert({
      thread_id: input.threadId,
      author_id: input.authorId,
      body: body || (input.attachment ? " " : ""),
      attachment_url: input.attachment?.url ?? null,
      attachment_name: input.attachment?.name ?? null,
      attachment_mime: input.attachment?.mime ?? null,
    })
    .select(DM_SELECT)
    .single();

  if (error || !data) return { message: null, error: withMappedDbError(error?.message, "Send failed") };

  await client
    .from("dm_threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", input.threadId);

  return { message: dmRowToMessage(data as unknown as DmMessageRow) };
}
