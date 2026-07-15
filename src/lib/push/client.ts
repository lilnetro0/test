import {
  getPushPublicConfig,
  registerPushDevice,
  unregisterPushDevice,
} from "@/lib/push/api";
import { isNativeApp } from "@/lib/capacitor";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

export async function browserPushSupported(): Promise<boolean> {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function enableBrowserPush(accessToken: string): Promise<{ ok: boolean; error?: string }> {
  if (isNativeApp()) {
    const { enableNativePush } = await import("@/lib/push/native");
    return enableNativePush(accessToken);
  }

  if (!(await browserPushSupported())) {
    return { ok: false, error: "Push not supported in this browser" };
  }

  const config = await getPushPublicConfig();
  if (!config.vapidPublicKey) {
    return { ok: false, error: "Push is not configured on the server (missing VAPID public key)" };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, error: "Notification permission denied" };
  }

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey) as BufferSource,
    });
  }

  const token = JSON.stringify(sub.toJSON());
  const res = await registerPushDevice({
    data: {
      accessToken,
      platform: "web",
      token,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    },
  });
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

export async function disableBrowserPush(accessToken: string): Promise<{ ok: boolean; error?: string }> {
  if (isNativeApp()) {
    const { disableNativePush } = await import("@/lib/push/native");
    return disableNativePush(accessToken);
  }

  if (!(await browserPushSupported())) return { ok: true };

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const token = JSON.stringify(sub.toJSON());
      await unregisterPushDevice({ data: { accessToken, token, platform: "web" } });
      await sub.unsubscribe();
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not disable push" };
  }
  return { ok: true };
}