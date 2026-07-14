import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { GameDto, TextChannelDto, VoiceChannelDto } from "@/lib/supabase/dto";

export const listHubs = createServerFn({ method: "GET" })
  .validator((data: { accessToken?: string }) => data)
  .handler(async ({ data }): Promise<{ hubs: GameDto[]; error?: string }> => {
    const client = getSupabaseServerClient(data.accessToken);
    if (!client) return { hubs: [], error: "Supabase not configured" };

    const { data: rows, error } = await client
      .from("hubs")
      .select("id, slug, name, member_count, active_count, game:games(*)")
      .order("name");

    if (error) return { hubs: [], error: error.message };

    const hubs: GameDto[] = (rows ?? []).map((h) => {
      const game = Array.isArray(h.game) ? h.game[0] : h.game;
      return {
        id: h.slug,
        name: game?.name ?? h.name,
        short: game?.short ?? h.slug.slice(0, 3).toUpperCase(),
        hubName: h.name,
        tint: game?.tint ?? "bg-stone-500/20",
        textTint: game?.text_tint ?? "text-stone-300",
        activeCount: h.active_count,
        category: game?.category ?? "sandbox",
        members: h.member_count,
      };
    });

    return { hubs };
  });

export const joinHub = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; hubId: string }) => data)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const client = getSupabaseServerClient(data.accessToken);
    if (!client) return { ok: false, error: "Supabase not configured" };

    const { data: userData, error: userError } = await client.auth.getUser(data.accessToken);
    if (userError || !userData.user) return { ok: false, error: "Not authenticated" };

    const { error } = await client.from("hub_members").upsert({
      hub_id: data.hubId,
      user_id: userData.user.id,
      role: "member",
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

export const listChannels = createServerFn({ method: "GET" })
  .validator((data: { accessToken: string; hubId: string }) => data)
  .handler(
    async ({
      data,
    }): Promise<{
      text: TextChannelDto[];
      voice: VoiceChannelDto[];
      error?: string;
    }> => {
      const client = getSupabaseServerClient(data.accessToken);
      if (!client) return { text: [], voice: [], error: "Supabase not configured" };

      const [textRes, voiceRes] = await Promise.all([
        client
          .from("text_channels")
          .select("id, name, topic, position")
          .eq("hub_id", data.hubId)
          .order("position"),
        client
          .from("voice_channels")
          .select("id, name, position, livekit_room_name")
          .eq("hub_id", data.hubId)
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
          livekitRoomName: c.livekit_room_name,
          members: [],
        })),
      };
    },
  );
