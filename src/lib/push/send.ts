/**
 * Server-only push delivery (Web Push / APNs / FCM).
 * Do not import from client components — use createServerFn handlers or API routes.
 */
import webpush from "web-push";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { apnsConfigured, sendApnsAlert } from "@/lib/push/apns";
import { fcmConfigured, sendFcmAlert } from "@/lib/push/fcm";

export type PushPayload = {
  title: string;
  body?: string;
  href?: string | null;
  tag?: string;
  kind?: string;
};

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
