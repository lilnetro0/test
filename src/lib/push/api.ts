import { createServerFn } from "@tanstack/react-start";
import webpush from "web-push";
import { requireAuth } from "@/lib/auth/require-auth";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";
import { apnsConfigured, sendApnsAlert } from "@/lib/push/apns";
import { fcmConfigured, sendFcmAlert } from "@/lib/push/fcm";

type Fail = { ok: false; error: string };
type Ok = { ok: true };

export type PushPlatform = "web" | "ios" | "android";

function vapidConfigured(): { publicKey: string; privateKey: string; subject: string } | null {
  const publicKey = (process.env.VAPID_PUBLIC_KEY as string | undefined)?.trim() ?? "";
  const privateKey = (process.env.VAPID_PRIVATE_KEY as string | undefined)?.trim() ?? "";
  const subject =
    (process.env.VAPID_SUBJECT as string | undefined)?.trim() ||
    (process.env.SITE_URL as string | undefined)?.trim() ||
    "mailto:safety@nexus.app";
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

function anyPushTransportReady(): boolean {
  return Boolean(vapidConfigured() || apnsConfigured() || fcmConfigured());
}

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

export type PushPayload = {
  title: string;
  body?: string;
  href?: string | null;
  tag?: string;
  kind?: string;
};

/** Send push to enabled devices: Web Push, APNs (iOS), FCM (Android) when configured. */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; skipped: string | null; errors: string[] }> {
  if (!anyPushTransportReady()) {
    return { sent: 0, skipped: "no_push_transport", errors: [] };
  }

  const vapid = vapidConfigured();
  const admin = getSupabaseAdminClient();
  if (!admin) return { sent: 0, skipped: "no_admin_client", errors: [] };

  const { data: prefs } = await admin
    .from("user_prefs")
    .select("push_enabled, notif_mentions_only")
    .eq("user_id", userId)
    .maybeSingle();

  if (prefs && prefs.push_enabled === false) {
    return { sent: 0, skipped: "user_disabled", errors: [] };
  }

  if (prefs?.notif_mentions_only && payload.kind && payload.kind !== "mention") {
    return { sent: 0, skipped: "mentions_only", errors: [] };
  }

  const { data: devices, error } = await admin
    .from("push_devices")
    .select("id, platform, token")
    .eq("user_id", userId)
    .eq("enabled", true);

  if (error) return { sent: 0, skipped: null, errors: [error.message] };
  if (!devices?.length) return { sent: 0, skipped: "no_devices", errors: [] };

  if (vapid) {
    webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
  }

  const webBody = JSON.stringify({
    title: payload.title,
    body: payload.body ?? "",
    href: payload.href ?? "/notifications",
    tag: payload.tag ?? "nexus",
  });

  let sent = 0;
  const errors: string[] = [];
  const staleIds: string[] = [];

  for (const device of devices) {
    if (device.platform === "web") {
      if (!vapid) continue;
      let subscription: webpush.PushSubscription;
      try {
        subscription = JSON.parse(device.token) as webpush.PushSubscription;
      } catch {
        staleIds.push(device.id);
        continue;
      }
      try {
        await webpush.sendNotification(subscription, webBody);
        sent += 1;
      } catch (e) {
        const status = (e as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) staleIds.push(device.id);
        errors.push(e instanceof Error ? e.message : "web_push_failed");
      }
      continue;
    }

    if (device.platform === "ios") {
      if (!apnsConfigured()) continue;
      const r = await sendApnsAlert(device.token, payload);
      if (r.ok) sent += 1;
      else {
        if (r.stale) staleIds.push(device.id);
        if (r.error !== "apns_not_configured") errors.push(r.error);
      }
      continue;
    }

    if (device.platform === "android") {
      if (!fcmConfigured()) continue;
      const r = await sendFcmAlert(device.token, payload);
      if (r.ok) sent += 1;
      else {
        if (r.stale) staleIds.push(device.id);
        if (r.error !== "fcm_not_configured") errors.push(r.error);
      }
    }
  }

  if (staleIds.length) {
    await admin.from("push_devices").delete().in("id", staleIds);
  }

  const nativeOnly =
    sent === 0 &&
    devices.length > 0 &&
    devices.every((d) => d.platform !== "web") &&
    !apnsConfigured() &&
    !fcmConfigured();

  return { sent, skipped: nativeOnly ? "native_only" : null, errors };
}

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

    const result = await sendPushToUser(row.user_id, {
      title: row.title,
      body: row.body,
      href: row.href,
      tag: row.id,
      kind: row.kind,
    });

    return { ok: true, sent: result.sent, skipped: result.skipped };
  });
