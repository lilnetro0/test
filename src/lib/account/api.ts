import { createHash } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth/require-auth";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";

type Fail = { ok: false; error: string };
type Ok = { ok: true };

function hashEmail(email: string | null): string | null {
  if (!email) return null;
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 40);
}

async function removeStorageFolder(
  admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  bucket: string,
  folder: string,
): Promise<void> {
  const { data: entries, error } = await admin.storage.from(bucket).list(folder, { limit: 1000 });
  if (error || !entries?.length) return;
  const paths = entries
    .filter((e) => e.name)
    .map((e) => `${folder}/${e.name}`);
  if (!paths.length) return;
  await admin.storage.from(bucket).remove(paths);
}

export const exportMyData = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAuth(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const client = getSupabaseServerClient(data.accessToken);
    if (!client) return { ok: false as const, error: "Supabase not configured" };

    const uid = auth.userId;

    const [
      profile,
      prefs,
      hubs,
      channelMessages,
      dmMessages,
      friendships,
      friendOutgoing,
      friendIncoming,
      blocks,
      reports,
      notifications,
    ] = await Promise.all([
      client.from("profiles").select("*").eq("id", uid).maybeSingle(),
      client.from("user_prefs").select("*").eq("user_id", uid).maybeSingle(),
      client.from("hub_members").select("hub_id, role, joined_at").eq("user_id", uid),
      client
        .from("messages")
        .select("id, channel_id, body, created_at, edited_at, pinned, deleted_at")
        .eq("author_id", uid)
        .order("created_at", { ascending: false })
        .limit(500),
      client
        .from("dm_messages")
        .select("id, thread_id, body, created_at, deleted_at")
        .eq("author_id", uid)
        .order("created_at", { ascending: false })
        .limit(500),
      client.from("friendships").select("friend_id, created_at").eq("user_id", uid),
      client.from("friend_requests").select("id, to_user_id, status, created_at").eq("from_user_id", uid),
      client.from("friend_requests").select("id, from_user_id, status, created_at").eq("to_user_id", uid),
      client.from("blocks").select("blocked_id, created_at").eq("blocker_id", uid),
      client
        .from("reports")
        .select("id, target_user_id, message_id, dm_message_id, reason, details, status, created_at")
        .eq("reporter_id", uid)
        .order("created_at", { ascending: false })
        .limit(100),
      client
        .from("notifications")
        .select("id, kind, title, body, href, read_at, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    const firstError =
      profile.error?.message ||
      prefs.error?.message ||
      hubs.error?.message ||
      channelMessages.error?.message ||
      dmMessages.error?.message ||
      friendships.error?.message ||
      friendOutgoing.error?.message ||
      friendIncoming.error?.message ||
      blocks.error?.message ||
      reports.error?.message ||
      notifications.error?.message;

    if (firstError) return { ok: false, error: firstError };

    const payload = {
      schema_version: 1,
      exported_at: new Date().toISOString(),
      user_id: uid,
      email: auth.email,
      profile: profile.data,
      prefs: prefs.data,
      hub_memberships: hubs.data ?? [],
      channel_messages: channelMessages.data ?? [],
      dm_messages: dmMessages.data ?? [],
      friendships: friendships.data ?? [],
      friend_requests: {
        outgoing: friendOutgoing.data ?? [],
        incoming: friendIncoming.data ?? [],
      },
      blocks: blocks.data ?? [],
      reports_filed: reports.data ?? [],
      notifications: notifications.data ?? [],
      notes: [
        "Channel and DM messages are capped at the 500 most recent authored each.",
        "Notifications capped at 200 most recent.",
        "Reports filed by you only; admin review notes are not included.",
      ],
    };

    return {
      ok: true as const,
      payloadJson: JSON.stringify(payload),
    };
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .validator(
    (data: {
      accessToken: string;
      confirmUsername: string;
      confirmPhrase: string;
    }) => data,
  )
  .handler(async ({ data }): Promise<Ok | Fail> => {
    const auth = await requireAuth(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error };

    if (data.confirmPhrase.trim() !== "DELETE") {
      return { ok: false, error: 'Type DELETE to confirm' };
    }

    const userClient = getSupabaseServerClient(data.accessToken);
    const admin = getSupabaseAdminClient();
    if (!userClient || !admin) {
      return { ok: false, error: "Supabase not configured" };
    }

    const { data: profile, error: profileError } = await userClient
      .from("profiles")
      .select("username, tag")
      .eq("id", auth.userId)
      .maybeSingle();

    if (profileError) return { ok: false, error: profileError.message };
    if (!profile) return { ok: false, error: "Profile not found" };

    const expected = profile.username.toLowerCase();
    if (data.confirmUsername.trim().toLowerCase() !== expected) {
      return { ok: false, error: "Username does not match" };
    }

    // Receipt before wipe (no FK — survives cascade).
    const { error: logError } = await admin.from("account_deletion_log").insert({
      user_id: auth.userId,
      username: `${profile.username}#${profile.tag}`,
      email_hash: hashEmail(auth.email),
      meta: { source: "settings.self_delete" },
    });
    if (logError) {
      console.warn("[account] deletion_log insert failed:", logError.message);
    }

    await removeStorageFolder(admin, "avatars", auth.userId);
    await removeStorageFolder(admin, "attachments", auth.userId);

    const { error: delError } = await admin.auth.admin.deleteUser(auth.userId);
    if (delError) return { ok: false, error: delError.message };

    return { ok: true };
  });
