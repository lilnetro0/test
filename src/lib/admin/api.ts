import { createServerFn } from "@tanstack/react-start";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";
import type { HubRole } from "@/lib/supabase/types";

function parseAdminIds(): Set<string> {
  const raw = (process.env.ADMIN_USER_IDS as string | undefined)?.trim() ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

async function requireAdmin(accessToken: string): Promise<
  | { ok: true; userId: string }
  | { ok: false; error: string; code: "AUTH" | "FORBIDDEN" | "CONFIG" }
> {
  const admins = parseAdminIds();
  if (!admins.size) {
    return { ok: false, error: "ADMIN_USER_IDS not configured", code: "CONFIG" };
  }
  const client = getSupabaseServerClient(accessToken);
  if (!client) return { ok: false, error: "Supabase not configured", code: "CONFIG" };

  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) return { ok: false, error: "Not authenticated", code: "AUTH" };
  if (!admins.has(data.user.id)) {
    return { ok: false, error: "Not an admin", code: "FORBIDDEN" };
  }
  return { ok: true, userId: data.user.id };
}

function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return s || "item";
}

type Fail = { ok: false; error: string };
type Ok = { ok: true };

export const checkIsAdmin = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string }) => data)
  .handler(async ({ data }): Promise<{ ok: boolean; admin: boolean }> => {
    const r = await requireAdmin(data.accessToken);
    return { ok: true, admin: r.ok };
  });

export const adminBanUser = createServerFn({ method: "POST" })
  .validator(
    (data: {
      accessToken: string;
      targetUserId: string;
      reason?: string;
      ban: boolean;
    }) => data,
  )
  .handler(async ({ data }): Promise<Ok | Fail> => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error };

    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false, error: "Service role not configured" };

    if (data.targetUserId === auth.userId) {
      return { ok: false, error: "Cannot ban yourself" };
    }

    const { error } = await admin
      .from("profiles")
      .update(
        data.ban
          ? {
              banned_at: new Date().toISOString(),
              ban_reason: (data.reason ?? "Suspended by admin").slice(0, 500),
            }
          : { banned_at: null, ban_reason: null },
      )
      .eq("id", data.targetUserId);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

export const adminLookupUser = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; usernameTag: string }) => data)
  .handler(
    async ({
      data,
    }): Promise<
      | {
          ok: true;
          profile: {
            id: string;
            username: string;
            tag: string;
            banned_at: string | null;
            ban_reason: string | null;
          } | null;
        }
      | Fail
    > => {
      const auth = await requireAdmin(data.accessToken);
      if (!auth.ok) return { ok: false, error: auth.error };

      const admin = getSupabaseAdminClient();
      if (!admin) return { ok: false, error: "Service role not configured" };

      const m = data.usernameTag.trim().match(/^([A-Za-z0-9_]{2,32})#?(\d{4})$/);
      if (!m) return { ok: false, error: "Use Username#1234" };

      const { data: row, error } = await admin
        .from("profiles")
        .select("id, username, tag, banned_at, ban_reason")
        .ilike("username", m[1])
        .eq("tag", m[2])
        .maybeSingle();

      if (error) return { ok: false, error: error.message };
      return { ok: true, profile: row };
    },
  );

export const adminListBanned = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string }) => data)
  .handler(
    async ({
      data,
    }): Promise<
      | {
          ok: true;
          profiles: Array<{
            id: string;
            username: string;
            tag: string;
            banned_at: string | null;
            ban_reason: string | null;
          }>;
        }
      | Fail
    > => {
      const auth = await requireAdmin(data.accessToken);
      if (!auth.ok) return { ok: false, error: auth.error };
      const admin = getSupabaseAdminClient();
      if (!admin) return { ok: false, error: "Service role not configured" };

      const { data: rows, error } = await admin
        .from("profiles")
        .select("id, username, tag, banned_at, ban_reason")
        .not("banned_at", "is", null)
        .order("banned_at", { ascending: false })
        .limit(100);

      if (error) return { ok: false, error: error.message };
      return { ok: true, profiles: rows ?? [] };
    },
  );

export const adminListGames = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "Service role not configured" };

    const { data: rows, error } = await admin.from("games").select("*").order("name");
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, games: rows ?? [] };
  });

export const adminUpsertGame = createServerFn({ method: "POST" })
  .validator(
    (data: {
      accessToken: string;
      game: {
        id: string;
        name: string;
        short: string;
        category: string;
        tint?: string;
        text_tint?: string;
        image_url?: string | null;
      };
    }) => data,
  )
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "Service role not configured" };

    const id = data.game.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!id) return { ok: false as const, error: "Game id required" };

    const { error } = await admin.from("games").upsert({
      id,
      name: data.game.name.trim(),
      short: data.game.short.trim().slice(0, 8) || id.slice(0, 3).toUpperCase(),
      category: data.game.category.trim() || "sandbox",
      tint: data.game.tint ?? "bg-stone-500/20",
      text_tint: data.game.text_tint ?? "text-stone-300",
      image_url: data.game.image_url ?? null,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const adminDeleteGame = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; gameId: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "Service role not configured" };

    const { error } = await admin.from("games").delete().eq("id", data.gameId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const adminListHubs = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "Service role not configured" };

    const { data: rows, error } = await admin
      .from("hubs")
      .select("id, game_id, slug, name, member_count, active_count, image_url, game:games(id, name, short, image_url)")
      .order("name");
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, hubs: rows ?? [] };
  });

export const adminUpsertHub = createServerFn({ method: "POST" })
  .validator(
    (data: {
      accessToken: string;
      hub: {
        id?: string;
        game_id: string;
        slug?: string;
        name: string;
        image_url?: string | null;
        active_count?: string;
      };
    }) => data,
  )
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "Service role not configured" };

    const name = data.hub.name.trim();
    if (!name) return { ok: false as const, error: "Hub name required" };
    const slug = (data.hub.slug?.trim() || slugify(name)).toLowerCase();

    if (data.hub.id) {
      const { error } = await admin
        .from("hubs")
        .update({
          game_id: data.hub.game_id,
          slug,
          name,
          image_url: data.hub.image_url ?? null,
          active_count: data.hub.active_count ?? "0",
        })
        .eq("id", data.hub.id);
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const, hubId: data.hub.id };
    }

    const { data: row, error } = await admin
      .from("hubs")
      .insert({
        game_id: data.hub.game_id,
        slug,
        name,
        image_url: data.hub.image_url ?? null,
        active_count: data.hub.active_count ?? "0",
      })
      .select("id")
      .single();
    if (error || !row) return { ok: false as const, error: error?.message ?? "Insert failed" };
    return { ok: true as const, hubId: row.id };
  });

export const adminDeleteHub = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; hubId: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "Service role not configured" };

    const { error } = await admin.from("hubs").delete().eq("id", data.hubId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const adminListChannels = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; hubId: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "Service role not configured" };

    const [text, voice] = await Promise.all([
      admin
        .from("text_channels")
        .select("*")
        .eq("hub_id", data.hubId)
        .order("position"),
      admin
        .from("voice_channels")
        .select("*")
        .eq("hub_id", data.hubId)
        .order("position"),
    ]);
    if (text.error) return { ok: false as const, error: text.error.message };
    if (voice.error) return { ok: false as const, error: voice.error.message };
    return {
      ok: true as const,
      text: text.data ?? [],
      voice: voice.data ?? [],
    };
  });

export const adminUpsertTextChannel = createServerFn({ method: "POST" })
  .validator(
    (data: {
      accessToken: string;
      channel: {
        id?: string;
        hub_id: string;
        name: string;
        slug?: string;
        topic?: string | null;
        position?: number;
      };
    }) => data,
  )
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "Service role not configured" };

    const name = data.channel.name.trim();
    if (!name) return { ok: false as const, error: "Channel name required" };
    const slug = (data.channel.slug?.trim() || slugify(name)).toLowerCase();

    if (data.channel.id) {
      const { error } = await admin
        .from("text_channels")
        .update({
          name,
          slug,
          topic: data.channel.topic ?? null,
          position: data.channel.position ?? 0,
        })
        .eq("id", data.channel.id);
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const };
    }

    const { error } = await admin.from("text_channels").insert({
      hub_id: data.channel.hub_id,
      name,
      slug,
      topic: data.channel.topic ?? null,
      position: data.channel.position ?? 0,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const adminDeleteTextChannel = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; channelId: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "Service role not configured" };

    const { error } = await admin.from("text_channels").delete().eq("id", data.channelId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const adminUpsertVoiceChannel = createServerFn({ method: "POST" })
  .validator(
    (data: {
      accessToken: string;
      channel: {
        id?: string;
        hub_id: string;
        name: string;
        slug?: string;
        position?: number;
        livekit_room_name?: string | null;
      };
    }) => data,
  )
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "Service role not configured" };

    const name = data.channel.name.trim();
    if (!name) return { ok: false as const, error: "Channel name required" };
    const slug = (data.channel.slug?.trim() || slugify(name)).toLowerCase();

    if (data.channel.id) {
      const { error } = await admin
        .from("voice_channels")
        .update({
          name,
          slug,
          position: data.channel.position ?? 0,
          livekit_room_name: data.channel.livekit_room_name ?? undefined,
        })
        .eq("id", data.channel.id);
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const };
    }

    const { data: row, error } = await admin
      .from("voice_channels")
      .insert({
        hub_id: data.channel.hub_id,
        name,
        slug,
        position: data.channel.position ?? 0,
        livekit_room_name: data.channel.livekit_room_name ?? null,
      })
      .select("id")
      .single();
    if (error || !row) return { ok: false as const, error: error?.message ?? "Insert failed" };

    if (!data.channel.livekit_room_name) {
      await admin
        .from("voice_channels")
        .update({ livekit_room_name: `nexus-${row.id}` })
        .eq("id", row.id);
    }
    return { ok: true as const };
  });

export const adminDeleteVoiceChannel = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; channelId: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "Service role not configured" };

    const { error } = await admin.from("voice_channels").delete().eq("id", data.channelId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const adminUploadHubMedia = createServerFn({ method: "POST" })
  .validator(
    (data: {
      accessToken: string;
      base64: string;
      contentType: string;
      fileName?: string;
      attachTo?: { kind: "game" | "hub"; id: string };
    }) => data,
  )
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "Service role not configured" };

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(data.contentType)) {
      return { ok: false as const, error: "Unsupported image type" };
    }

    const raw = data.base64.includes(",") ? data.base64.split(",")[1]! : data.base64;
    const bytes = Buffer.from(raw, "base64");
    if (bytes.length > 5 * 1024 * 1024) {
      return { ok: false as const, error: "Image too large (max 5MB)" };
    }

    const ext =
      data.contentType === "image/png"
        ? "png"
        : data.contentType === "image/webp"
          ? "webp"
          : data.contentType === "image/gif"
            ? "gif"
            : "jpg";
    const path = `admin/${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await admin.storage.from("hub-media").upload(path, bytes, {
      contentType: data.contentType,
      upsert: false,
    });
    if (upErr) return { ok: false as const, error: upErr.message };

    const { data: pub } = admin.storage.from("hub-media").getPublicUrl(path);
    const url = pub.publicUrl;

    if (data.attachTo?.kind === "game") {
      const { error } = await admin
        .from("games")
        .update({ image_url: url })
        .eq("id", data.attachTo.id);
      if (error) return { ok: false as const, error: error.message };
    } else if (data.attachTo?.kind === "hub") {
      const { error } = await admin
        .from("hubs")
        .update({ image_url: url })
        .eq("id", data.attachTo.id);
      if (error) return { ok: false as const, error: error.message };
    }

    return { ok: true as const, url };
  });

export const adminSetHubRole = createServerFn({ method: "POST" })
  .validator(
    (data: {
      accessToken: string;
      hubId: string;
      userId: string;
      role: HubRole;
    }) => data,
  )
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "Service role not configured" };

    const { error } = await admin.from("hub_members").upsert({
      hub_id: data.hubId,
      user_id: data.userId,
      role: data.role,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const adminKickFromHub = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; hubId: string; userId: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "Service role not configured" };

    const { error } = await admin
      .from("hub_members")
      .delete()
      .eq("hub_id", data.hubId)
      .eq("user_id", data.userId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const adminListReports = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; status?: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "Service role not configured" };

    let q = admin
      .from("reports")
      .select(
        "id, reporter_id, target_user_id, message_id, reason, details, status, created_at, reporter:profiles!reporter_id(username, tag), target:profiles!target_user_id(username, tag)",
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (data.status) q = q.eq("status", data.status);

    const { data: rows, error } = await q;
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, reports: rows ?? [] };
  });

export const adminSetReportStatus = createServerFn({ method: "POST" })
  .validator(
    (data: {
      accessToken: string;
      reportId: string;
      status: "open" | "reviewing" | "resolved" | "dismissed";
    }) => data,
  )
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "Service role not configured" };

    const { error } = await admin
      .from("reports")
      .update({ status: data.status })
      .eq("id", data.reportId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const adminDeleteMessage = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; messageId: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "Service role not configured" };

    const { error } = await admin.from("messages").delete().eq("id", data.messageId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const adminPinMessage = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; messageId: string; pinned: boolean }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "Service role not configured" };

    const { error } = await admin
      .from("messages")
      .update({ pinned: data.pinned })
      .eq("id", data.messageId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
