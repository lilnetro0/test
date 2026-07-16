import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function getLiveKitEnv(): { url: string; apiKey: string; apiSecret: string } | null {
  const url = (process.env.LIVEKIT_URL as string | undefined)?.trim();
  const apiKey = (process.env.LIVEKIT_API_KEY as string | undefined)?.trim();
  const apiSecret = (process.env.LIVEKIT_API_SECRET as string | undefined)?.trim();
  if (!url || !apiKey || !apiSecret) return null;
  return { url, apiKey, apiSecret };
}

function liveKitHttpHost(wsUrl: string): string {
  const u = new URL(wsUrl);
  if (u.protocol === "wss:") u.protocol = "https:";
  else if (u.protocol === "ws:") u.protocol = "http:";
  u.pathname = "";
  u.search = "";
  u.hash = "";
  return u.toString().replace(/\/$/, "");
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type VoiceOccupancyMember = {
  userId: string;
  name: string;
  muted?: boolean;
};

export type VoiceOccupancyChannel = {
  channelId: string;
  channelName: string;
  roomName: string;
  count: number;
  capacity: number | null;
  members: VoiceOccupancyMember[];
};

type CacheEntry = { at: number; channels: VoiceOccupancyChannel[] };
const occupancyCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 8_000;

/**
 * Pre-join LiveKit room roster for a hub's voice channels.
 * Uses RoomServiceClient — does not require the caller to join.
 */
export const listVoiceRoomOccupancy = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; hubId: string }) => data)
  .handler(
    async ({
      data,
    }): Promise<
      | { ok: true; channels: VoiceOccupancyChannel[]; configured: boolean }
      | { ok: false; error: string; code?: "AUTH" | "FORBIDDEN" | "NOT_CONFIGURED" }
    > => {
      if (!UUID_RE.test(data.hubId)) {
        return { ok: false, error: "Invalid hub", code: "FORBIDDEN" };
      }

      const client = getSupabaseServerClient(data.accessToken);
      if (!client) return { ok: false, error: "Supabase not configured", code: "AUTH" };

      const { data: userData, error: userError } = await client.auth.getUser(data.accessToken);
      if (userError || !userData.user) {
        return { ok: false, error: "Not authenticated", code: "AUTH" };
      }

      const uid = userData.user.id;
      const { data: membership } = await client
        .from("hub_members")
        .select("user_id")
        .eq("hub_id", data.hubId)
        .eq("user_id", uid)
        .maybeSingle();

      if (!membership) {
        return { ok: false, error: "Join the hub first", code: "FORBIDDEN" };
      }

      let channelRows:
        | {
            id: string;
            name: string;
            livekit_room_name: string | null;
            capacity?: number | null;
          }[]
        | null = null;

      {
        const withCap = await client
          .from("voice_channels")
          .select("id, name, livekit_room_name, capacity")
          .eq("hub_id", data.hubId)
          .order("position");
        if (!withCap.error) {
          channelRows = withCap.data;
        } else {
          const bare = await client
            .from("voice_channels")
            .select("id, name, livekit_room_name")
            .eq("hub_id", data.hubId)
            .order("position");
          if (bare.error) return { ok: false, error: bare.error.message };
          channelRows = bare.data;
        }
      }

      const channels = channelRows;

      const lk = getLiveKitEnv();
      if (!lk) {
        return {
          ok: true,
          configured: false,
          channels: (channels ?? []).map((c) => ({
            channelId: c.id,
            channelName: c.name,
            roomName: c.livekit_room_name?.trim() || `nexus-${c.id}`,
            count: 0,
            capacity: typeof c.capacity === "number" ? c.capacity : null,
            members: [],
          })),
        };
      }

      const cached = occupancyCache.get(data.hubId);
      if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
        return { ok: true, configured: true, channels: cached.channels };
      }

      const { RoomServiceClient } = await import("livekit-server-sdk");
      const svc = new RoomServiceClient(liveKitHttpHost(lk.url), lk.apiKey, lk.apiSecret);

      const result: VoiceOccupancyChannel[] = [];
      for (const c of channels ?? []) {
        const roomName = c.livekit_room_name?.trim() || `nexus-${c.id}`;
        let members: VoiceOccupancyMember[] = [];
        try {
          const participants = await svc.listParticipants(roomName);
          members = participants.map((p) => ({
            userId: p.identity,
            name: p.name?.trim() || p.identity,
            // AUDIO track type is typically 1; any muted published track ≈ mic off for lobby UI
            muted: Boolean(p.tracks?.some((t) => t.muted)),
          }));
        } catch {
          members = [];
        }
        result.push({
          channelId: c.id,
          channelName: c.name,
          roomName,
          count: members.length,
          capacity: typeof c.capacity === "number" ? c.capacity : null,
          members,
        });
      }

      occupancyCache.set(data.hubId, { at: Date.now(), channels: result });
      return { ok: true, configured: true, channels: result };
    },
  );
