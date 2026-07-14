import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function getLiveKitEnv(): { url: string; apiKey: string; apiSecret: string } | null {
  const url = (process.env.LIVEKIT_URL as string | undefined)?.trim();
  const apiKey = (process.env.LIVEKIT_API_KEY as string | undefined)?.trim();
  const apiSecret = (process.env.LIVEKIT_API_SECRET as string | undefined)?.trim();
  if (!url || !apiKey || !apiSecret) return null;
  return { url, apiKey, apiSecret };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Mint a LiveKit room token for a hub voice channel or DM thread.
 */
export const createVoiceToken = createServerFn({ method: "POST" })
  .validator(
    (data: {
      accessToken: string;
      channelId?: string;
      threadId?: string;
      roomName?: string;
      displayName?: string;
    }) => data,
  )
  .handler(
    async ({
      data,
    }): Promise<
      | { ok: true; token: string; url: string; roomName: string }
      | { ok: false; error: string; code?: "NOT_CONFIGURED" | "AUTH" | "FORBIDDEN" }
    > => {
      const lk = getLiveKitEnv();
      if (!lk) {
        return { ok: false, error: "LiveKit not configured", code: "NOT_CONFIGURED" };
      }

      const client = getSupabaseServerClient(data.accessToken);
      if (!client) return { ok: false, error: "Supabase not configured", code: "AUTH" };

      const { data: userData, error: userError } = await client.auth.getUser(data.accessToken);
      if (userError || !userData.user) {
        return { ok: false, error: "Not authenticated", code: "AUTH" };
      }

      const uid = userData.user.id;

      const { data: profile } = await client
        .from("profiles")
        .select("banned_at")
        .eq("id", uid)
        .maybeSingle();
      if (profile?.banned_at) {
        return { ok: false, error: "Account banned", code: "FORBIDDEN" };
      }

      let roomName = "";

      if (data.threadId && UUID_RE.test(data.threadId)) {
        const { data: part } = await client
          .from("dm_participants")
          .select("thread_id")
          .eq("thread_id", data.threadId)
          .eq("user_id", uid)
          .maybeSingle();
        if (!part) {
          return { ok: false, error: "Not a participant of this DM", code: "FORBIDDEN" };
        }
        roomName = `nexus-dm-${data.threadId}`;
      } else if (data.channelId && UUID_RE.test(data.channelId)) {
        const { data: channel, error: chErr } = await client
          .from("voice_channels")
          .select("id, hub_id, livekit_room_name, name")
          .eq("id", data.channelId)
          .maybeSingle();

        if (chErr || !channel) {
          return { ok: false, error: chErr?.message ?? "Voice channel not found", code: "FORBIDDEN" };
        }

        const { data: membership } = await client
          .from("hub_members")
          .select("user_id")
          .eq("hub_id", channel.hub_id)
          .eq("user_id", uid)
          .maybeSingle();

        if (!membership) {
          return { ok: false, error: "Join the hub before entering voice", code: "FORBIDDEN" };
        }

        roomName = channel.livekit_room_name?.trim() || `nexus-${channel.id}`;
      } else {
        return { ok: false, error: "Invalid voice channel or DM thread", code: "FORBIDDEN" };
      }

      const displayName =
        data.displayName?.trim() ||
        (typeof userData.user.user_metadata?.username === "string"
          ? userData.user.user_metadata.username
          : null) ||
        userData.user.email?.split("@")[0] ||
        "player";

      const { AccessToken } = await import("livekit-server-sdk");
      const at = new AccessToken(lk.apiKey, lk.apiSecret, {
        identity: uid,
        name: displayName,
        ttl: "2h",
      });
      at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });

      const token = await at.toJwt();
      return { ok: true, token, url: lk.url, roomName };
    },
  );

export const getVoiceHealth = createServerFn({ method: "GET" }).handler(async () => {
  const lk = getLiveKitEnv();
  return {
    livekitConfigured: Boolean(lk),
    urlHost: lk?.url
      ? (() => {
          try {
            return new URL(lk.url).host;
          } catch {
            return "set";
          }
        })()
      : null,
  };
});
