import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth/require-auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type Fail = { ok: false; error: string };
type Ok = { ok: true };

export type PushPlatform = "web" | "ios" | "android";

/** Public VAPID config — safe for client (no private key). */
export const getPushPublicConfig = createServerFn({ method: "GET" }).handler(async () => {
  const publicKey =
    (process.env.VITE_VAPID_PUBLIC_KEY as string | undefined)?.trim() ||
    (process.env.VAPID_PUBLIC_KEY as string | undefined)?.trim() ||
    "";
  return {
    vapidPublicKey: publicKey || null,
    webPushReady: Boolean(publicKey && (process.env.VAPID_PRIVATE_KEY as string | undefined)?.trim()),
  };
});

export const registerPushDevice = createServerFn({ method: "POST" })
  .validator(
    (data: {
      accessToken: string;
      platform: PushPlatform;
      token: string;
      userAgent?: string;
    }) => data,
  )
  .handler(async ({ data }): Promise<Ok | Fail> => {
    const auth = await requireAuth(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error };

    const token = data.token.trim();
    if (token.length < 8 || token.length > 4096) {
      return { ok: false, error: "Invalid device token" };
    }
    if (!["web", "ios", "android"].includes(data.platform)) {
      return { ok: false, error: "Invalid platform" };
    }

    const client = getSupabaseServerClient(data.accessToken);
    if (!client) return { ok: false, error: "Supabase not configured" };

    const { error } = await client.from("push_devices").upsert(
      {
        user_id: auth.userId,
        platform: data.platform,
        token,
        enabled: true,
        user_agent: data.userAgent?.slice(0, 300) ?? null,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "platform,token" },
    );

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

export const unregisterPushDevice = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; token: string; platform?: PushPlatform }) => data)
  .handler(async ({ data }): Promise<Ok | Fail> => {
    const auth = await requireAuth(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error };

    const client = getSupabaseServerClient(data.accessToken);
    if (!client) return { ok: false, error: "Supabase not configured" };

    let q = client
      .from("push_devices")
      .delete()
      .eq("user_id", auth.userId)
      .eq("token", data.token.trim());
    if (data.platform) q = q.eq("platform", data.platform);

    const { error } = await q;
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

/** Fan-out push for a notification the caller owns — delivery stays in `./send` (server-only). */
export const dispatchPushForNotification = createServerFn({ method: "POST" })
  .validator((data: { accessToken: string; notificationId: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true; sent: number; skipped: string | null } | Fail> => {
    const auth = await requireAuth(data.accessToken);
    if (!auth.ok) return { ok: false, error: auth.error };

    const client = getSupabaseServerClient(data.accessToken);
    if (!client) return { ok: false, error: "Supabase not configured" };

    const { data: row, error } = await client
      .from("notifications")
      .select("id, user_id, title, body, href, kind")
      .eq("id", data.notificationId)
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!row) return { ok: false, error: "Notification not found" };

    const { sendPushToUser } = await import("@/lib/push/send");
    const result = await sendPushToUser(row.user_id, {
      title: row.title,
      body: row.body,
      href: row.href,
      tag: row.id,
      kind: row.kind,
    });

    return { ok: true, sent: result.sent, skipped: result.skipped };
  });
