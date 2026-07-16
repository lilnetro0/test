import { createServerFn } from "@tanstack/react-start";
import { normalizeArabicForSearch } from "@/lib/arabic-normalize";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { HubRole } from "@/lib/supabase/types";
import { requireAdmin, writeAdminAudit } from "@/lib/admin/authz";
import { HUB_MEDIA_MAX_BYTES, IMAGE_MIME_TYPES } from "@/lib/supabase/storage-policy";
import { gameArtworkColumn, type GameArtworkSlot } from "@/lib/game-artwork";

function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return s || "item";
}

async function seedMenaChannels(
  admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  hubId: string,
): Promise<{ created: number; skipped: number }> {
  const { MENA_HUB_TEXT_TEMPLATE, MENA_HUB_VOICE_TEMPLATE } = await import("@/lib/hub-templates");
  let created = 0;
  let skipped = 0;

  const { data: existingText } = await admin
    .from("text_channels")
    .select("slug")
    .eq("hub_id", hubId);
  const textSlugs = new Set((existingText ?? []).map((r) => r.slug));

  for (const ch of MENA_HUB_TEXT_TEMPLATE) {
    if (textSlugs.has(ch.slug)) {
      skipped += 1;
      continue;
    }
    const { error } = await admin.from("text_channels").insert({
      hub_id: hubId,
      name: ch.name,
      slug: ch.slug,
      topic: ch.topic,
      position: ch.position,
    });
    if (!error) created += 1;
  }

  const { data: existingVoice } = await admin
    .from("voice_channels")
    .select("slug")
    .eq("hub_id", hubId);
  const voiceSlugs = new Set((existingVoice ?? []).map((r) => r.slug));

  for (const ch of MENA_HUB_VOICE_TEMPLATE) {
    if (voiceSlugs.has(ch.slug)) {
      skipped += 1;
      continue;
    }
    const { error } = await admin.from("voice_channels").insert({
      hub_id: hubId,
      name: ch.name,
      slug: ch.slug,
      position: ch.position,
      livekit_room_name: `nexus-hub-${hubId}-${ch.slug}`,
    });
    if (!error) created += 1;
  }

  return { created, skipped };
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
    await writeAdminAudit({
      actorId: auth.userId,
      action: data.ban ? "user.ban" : "user.unban",
      targetType: "user",
      targetId: data.targetUserId,
      meta: data.ban ? { reason: (data.reason ?? "Suspended by admin").slice(0, 500) } : undefined,
    });
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
        .eq("username_search_norm", normalizeArabicForSearch(m[1]))
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
        banner_url?: string | null;
        background_url?: string | null;
        icon_url?: string | null;
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
      banner_url: data.game.banner_url ?? null,
      background_url: data.game.background_url ?? null,
      icon_url: data.game.icon_url ?? null,
    });
    if (error) return { ok: false as const, error: error.message };
    await writeAdminAudit({
      actorId: auth.userId,
      action: "game.upsert",
      targetType: "game",
      targetId: id,
    });
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
    await writeAdminAudit({
      actorId: auth.userId,
      action: "game.delete",
      targetType: "game",
      targetId: data.gameId,
    });
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
      .select(
        "id, game_id, slug, name, member_count, active_count, image_url, region, game:games(id, name, short, image_url)",
      )
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
        region?: string | null;
      };
      /** When creating: seed MENA Arabic channel template (skip existing slugs). */
      applyMenaChannelTemplate?: boolean;
    }) => data,
  )
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "Service role not configured" };

    const name = data.hub.name.trim();
    if (!name) return { ok: false as const, error: "Hub name required" };
    const gameId = data.hub.game_id.trim();
    if (!gameId) return { ok: false as const, error: "game_id required" };
    // Default slug = catalog game id (official hub). Explicit slug may differ (regional hubs).
    const slug = (data.hub.slug?.trim() || gameId).toLowerCase();
    const { normalizeRegionCode } = await import("@/lib/regions");
    const region = normalizeRegionCode(data.hub.region ?? "") || null;

    if (data.hub.id) {
      const { error } = await admin
        .from("hubs")
        .update({
          game_id: gameId,
          slug,
          name,
          image_url: data.hub.image_url ?? null,
          active_count: data.hub.active_count ?? "0",
          region,
        })
        .eq("id", data.hub.id);
      if (error) return { ok: false as const, error: error.message };
      await writeAdminAudit({
        actorId: auth.userId,
        action: "hub.update",
        targetType: "hub",
        targetId: data.hub.id,
        meta: { slug, game_id: gameId, region },
      });
      return { ok: true as const, hubId: data.hub.id, slugDiffersFromGame: slug !== gameId };
    }

    const { data: row, error } = await admin
      .from("hubs")
      .insert({
        game_id: gameId,
        slug,
        name,
        image_url: data.hub.image_url ?? null,
        active_count: data.hub.active_count ?? "0",
        region,
      })
      .select("id")
      .single();
    if (error || !row) return { ok: false as const, error: error?.message ?? "Insert failed" };

    // Creator becomes hub admin (founder) via service role.
    const { error: memberError } = await admin.from("hub_members").upsert(
      {
        hub_id: row.id,
        user_id: auth.userId,
        role: "admin",
      },
      { onConflict: "hub_id,user_id" },
    );
    if (memberError) {
      console.warn("[admin] hub founder membership failed:", memberError.message);
    }

    let channelsSeeded = 0;
    if (data.applyMenaChannelTemplate) {
      const seeded = await seedMenaChannels(admin, row.id);
      channelsSeeded = seeded.created;
    }

    await writeAdminAudit({
      actorId: auth.userId,
      action: "hub.create",
      targetType: "hub",
      targetId: row.id,
      meta: { slug, game_id: gameId, founder: auth.userId, region, channelsSeeded },
    });
    return {
      ok: true as const,
      hubId: row.id,
      slugDiffersFromGame: slug !== gameId,
      channelsSeeded,
    };
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
    await writeAdminAudit({
      actorId: auth.userId,
      action: "hub.delete",
      targetType: "hub",
      targetId: data.hubId,
    });
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

/** Seed Arabic/MENA default channels on an existing hub (idempotent by slug). */
export const adminApplyMenaChannelTemplate = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; hubId: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "Service role not configured" };

    const result = await seedMenaChannels(admin, data.hubId);
    await writeAdminAudit({
      actorId: auth.userId,
      action: "hub.apply_mena_channel_template",
      targetType: "hub",
      targetId: data.hubId,
      meta: result,
    });
    return { ok: true as const, ...result };
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
      await writeAdminAudit({
        actorId: auth.userId,
        action: "text_channel.update",
        targetType: "text_channel",
        targetId: data.channel.id,
        meta: { hub_id: data.channel.hub_id },
      });
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
    await writeAdminAudit({
      actorId: auth.userId,
      action: "text_channel.create",
      targetType: "text_channel",
      targetId: slug,
      meta: { hub_id: data.channel.hub_id },
    });
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
    await writeAdminAudit({
      actorId: auth.userId,
      action: "text_channel.delete",
      targetType: "text_channel",
      targetId: data.channelId,
    });
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
      await writeAdminAudit({
        actorId: auth.userId,
        action: "voice_channel.update",
        targetType: "voice_channel",
        targetId: data.channel.id,
        meta: { hub_id: data.channel.hub_id },
      });
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
    await writeAdminAudit({
      actorId: auth.userId,
      action: "voice_channel.create",
      targetType: "voice_channel",
      targetId: row.id,
      meta: { hub_id: data.channel.hub_id },
    });
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
    await writeAdminAudit({
      actorId: auth.userId,
      action: "voice_channel.delete",
      targetType: "voice_channel",
      targetId: data.channelId,
    });
    return { ok: true as const };
  });

export const adminUploadHubMedia = createServerFn({ method: "POST" })
  .validator(
    (data: {
      accessToken: string;
      base64: string;
      contentType: string;
      fileName?: string;
      /** Artwork slot when attaching to a game (default cover). Hubs always use cover. */
      slot?: GameArtworkSlot;
      attachTo?: { kind: "game" | "hub"; id: string };
    }) => data,
  )
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "Service role not configured" };

    const allowed = IMAGE_MIME_TYPES as readonly string[];
    if (!allowed.includes(data.contentType)) {
      return { ok: false as const, error: "Unsupported image type" };
    }

    const raw = data.base64.includes(",") ? data.base64.split(",")[1]! : data.base64;
    const bytes = Buffer.from(raw, "base64");
    if (bytes.length > HUB_MEDIA_MAX_BYTES) {
      return { ok: false as const, error: "Image too large (max 8MB)" };
    }

    const ext =
      data.contentType === "image/png"
        ? "png"
        : data.contentType === "image/webp"
          ? "webp"
          : data.contentType === "image/gif"
            ? "gif"
            : "jpg";
    const slot: GameArtworkSlot = data.slot ?? "cover";
    const folder = data.attachTo
      ? `admin/${data.attachTo.kind}/${data.attachTo.id}`
      : "admin";
    const path = `${folder}/${slot}-${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await admin.storage.from("hub-media").upload(path, bytes, {
      contentType: data.contentType,
      upsert: false,
    });
    if (upErr) return { ok: false as const, error: upErr.message };

    const { data: pub } = admin.storage.from("hub-media").getPublicUrl(path);
    const url = pub.publicUrl;

    if (data.attachTo?.kind === "game") {
      const column = gameArtworkColumn(slot);
      const patch =
        column === "image_url"
          ? { image_url: url }
          : column === "banner_url"
            ? { banner_url: url }
            : column === "background_url"
              ? { background_url: url }
              : { icon_url: url };
      const { error } = await admin.from("games").update(patch).eq("id", data.attachTo.id);
      if (error) return { ok: false as const, error: error.message };
    } else if (data.attachTo?.kind === "hub") {
      const { error } = await admin
        .from("hubs")
        .update({ image_url: url })
        .eq("id", data.attachTo.id);
      if (error) return { ok: false as const, error: error.message };
    }

    await writeAdminAudit({
      actorId: auth.userId,
      action: "media.upload",
      targetType: data.attachTo?.kind ?? "file",
      targetId: data.attachTo?.id ?? path,
      meta: { path, url, slot },
    });
    return { ok: true as const, url, slot };
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
    await writeAdminAudit({
      actorId: auth.userId,
      action: "hub_member.set_role",
      targetType: "user",
      targetId: data.userId,
      meta: { hub_id: data.hubId, role: data.role },
    });
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
    await writeAdminAudit({
      actorId: auth.userId,
      action: "hub_member.kick",
      targetType: "user",
      targetId: data.userId,
      meta: { hub_id: data.hubId },
    });
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
        "id, reporter_id, target_user_id, message_id, dm_message_id, voice_channel_id, reason, details, status, resolution_note, reviewed_at, reviewed_by, created_at, reporter:profiles!reporter_id(username, tag), target:profiles!target_user_id(username, tag)",
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);

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
      resolutionNote?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "Service role not configured" };

    const patch: {
      status: typeof data.status;
      reviewed_at?: string;
      reviewed_by?: string;
      resolution_note?: string;
    } = { status: data.status };

    if (data.status !== "open") {
      patch.reviewed_at = new Date().toISOString();
      patch.reviewed_by = auth.userId;
    }
    if (typeof data.resolutionNote === "string") {
      patch.resolution_note = data.resolutionNote.slice(0, 500);
    }

    const { error } = await admin.from("reports").update(patch).eq("id", data.reportId);
    if (error) return { ok: false as const, error: error.message };
    await writeAdminAudit({
      actorId: auth.userId,
      action: "report.set_status",
      targetType: "report",
      targetId: data.reportId,
      meta: {
        status: data.status,
        note: data.resolutionNote?.slice(0, 120) ?? null,
      },
    });
    return { ok: true as const };
  });

export const adminDeleteMessage = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; messageId: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "Service role not configured" };

    const { error } = await admin
      .from("messages")
      .update({
        deleted_at: new Date().toISOString(),
        pinned: false,
        body: " ",
        attachment_url: null,
        attachment_name: null,
        attachment_mime: null,
      })
      .eq("id", data.messageId)
      .is("deleted_at", null);
    if (error) return { ok: false as const, error: error.message };
    await writeAdminAudit({
      actorId: auth.userId,
      action: "message.soft_delete",
      targetType: "message",
      targetId: data.messageId,
    });
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
    await writeAdminAudit({
      actorId: auth.userId,
      action: data.pinned ? "message.pin" : "message.unpin",
      targetType: "message",
      targetId: data.messageId,
    });
    return { ok: true as const };
  });

export const adminListPlatformAdmins = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "Service role not configured" };

    const { data: rows, error } = await admin
      .from("platform_roles")
      .select("user_id, role, granted_by, created_at")
      .eq("role", "platform_admin")
      .order("created_at", { ascending: true });
    if (error) return { ok: false as const, error: error.message };

    const ids = (rows ?? []).map((r) => r.user_id);
    const { data: profiles, error: profileError } = ids.length
      ? await admin.from("profiles").select("id, username, tag").in("id", ids)
      : { data: [] as Array<{ id: string; username: string; tag: string }>, error: null };
    if (profileError) return { ok: false as const, error: profileError.message };

    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
    return {
      ok: true as const,
      admins: (rows ?? []).map((r) => ({
        user_id: r.user_id,
        role: r.role as "platform_admin",
        granted_by: r.granted_by,
        created_at: r.created_at,
        username: byId.get(r.user_id)?.username ?? "unknown",
        tag: byId.get(r.user_id)?.tag ?? "0000",
      })),
    };
  });

export const adminGrantPlatformRole = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; targetUserId: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "Service role not configured" };

    const targetId = data.targetUserId.trim();
    if (!targetId) return { ok: false as const, error: "User id required" };

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, username, tag, banned_at")
      .eq("id", targetId)
      .maybeSingle();
    if (profileError) return { ok: false as const, error: profileError.message };
    if (!profile) return { ok: false as const, error: "Profile not found" };
    if (profile.banned_at) return { ok: false as const, error: "Cannot grant role to a banned user" };

    const { error } = await admin.from("platform_roles").upsert(
      {
        user_id: targetId,
        role: "platform_admin",
        granted_by: auth.userId,
      },
      { onConflict: "user_id" },
    );
    if (error) return { ok: false as const, error: error.message };

    await writeAdminAudit({
      actorId: auth.userId,
      action: "platform_role.grant",
      targetType: "user",
      targetId: targetId,
      meta: { role: "platform_admin", username: profile.username },
    });
    return { ok: true as const };
  });

export const adminRevokePlatformRole = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; targetUserId: string }) => data)
  .handler(async ({ data }) => {
    const auth = await requireAdmin(data.accessToken);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const admin = getSupabaseAdminClient();
    if (!admin) return { ok: false as const, error: "Service role not configured" };

    const targetId = data.targetUserId.trim();
    if (!targetId) return { ok: false as const, error: "User id required" };

    const { count, error: countError } = await admin
      .from("platform_roles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "platform_admin");
    if (countError) return { ok: false as const, error: countError.message };

    if ((count ?? 0) <= 1) {
      return {
        ok: false as const,
        error: "Cannot revoke the last platform admin (add another admin first)",
      };
    }

    const { error } = await admin.from("platform_roles").delete().eq("user_id", targetId);
    if (error) return { ok: false as const, error: error.message };

    await writeAdminAudit({
      actorId: auth.userId,
      action: "platform_role.revoke",
      targetType: "user",
      targetId: targetId,
      meta: { role: "platform_admin" },
    });
    return { ok: true as const };
  });
