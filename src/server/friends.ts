import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { FriendDto } from "@/lib/supabase/dto";

function toFriend(row: {
  id: string;
  username: string;
  tag: string;
  status: string;
  status_text: string;
}): FriendDto {
  const status = (["online", "idle", "dnd", "offline"] as const).includes(
    row.status as FriendDto["status"],
  )
    ? (row.status as FriendDto["status"])
    : "offline";
  return {
    id: row.id,
    name: row.username,
    tag: `#${row.tag}`,
    status,
    activity: row.status_text || undefined,
  };
}

export const listFriends = createServerFn({ method: "GET" })
  .validator((data: { accessToken: string }) => data)
  .handler(async ({ data }): Promise<{ friends: FriendDto[]; error?: string }> => {
    const client = getSupabaseServerClient(data.accessToken);
    if (!client) return { friends: [], error: "Supabase not configured" };

    const { data: userData, error: userError } = await client.auth.getUser(data.accessToken);
    if (userError || !userData.user) return { friends: [], error: "Not authenticated" };

    const uid = userData.user.id;
    const { data: rows, error } = await client
      .from("friendships")
      .select("friend_id, user_id")
      .or(`user_id.eq.${uid},friend_id.eq.${uid}`);

    if (error) return { friends: [], error: error.message };

    const otherIds = (rows ?? []).map((r) => (r.user_id === uid ? r.friend_id : r.user_id));
    if (otherIds.length === 0) return { friends: [] };

    const { data: profiles, error: pErr } = await client
      .from("profiles")
      .select("id, username, tag, status, status_text")
      .in("id", otherIds);

    if (pErr) return { friends: [], error: pErr.message };
    return { friends: (profiles ?? []).map(toFriend) };
  });

export const sendFriendRequest = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; toUserId: string }) => data)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const client = getSupabaseServerClient(data.accessToken);
    if (!client) return { ok: false, error: "Supabase not configured" };

    const { data: userData, error: userError } = await client.auth.getUser(data.accessToken);
    if (userError || !userData.user) return { ok: false, error: "Not authenticated" };

    const { error } = await client.from("friend_requests").insert({
      from_user_id: userData.user.id,
      to_user_id: data.toUserId,
      status: "pending",
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

export const acceptFriendRequest = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; requestId: string }) => data)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const client = getSupabaseServerClient(data.accessToken);
    if (!client) return { ok: false, error: "Supabase not configured" };

    const { data: userData, error: userError } = await client.auth.getUser(data.accessToken);
    if (userError || !userData.user) return { ok: false, error: "Not authenticated" };

    const { data: req, error: reqErr } = await client
      .from("friend_requests")
      .select("*")
      .eq("id", data.requestId)
      .eq("to_user_id", userData.user.id)
      .maybeSingle();

    if (reqErr || !req) return { ok: false, error: reqErr?.message ?? "Request not found" };

    const { error: updErr } = await client
      .from("friend_requests")
      .update({ status: "accepted" })
      .eq("id", req.id);

    if (updErr) return { ok: false, error: updErr.message };

    const { error: friendErr } = await client.from("friendships").insert([
      { user_id: req.from_user_id, friend_id: req.to_user_id },
      { user_id: req.to_user_id, friend_id: req.from_user_id },
    ]);

    if (friendErr) return { ok: false, error: friendErr.message };
    return { ok: true };
  });
