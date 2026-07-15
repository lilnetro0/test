/**
 * Capacitor Push Notifications — register native device tokens (Phase 11 follow-up).
 * Registers Cap push tokens into push_devices. Server send uses APNs/FCM when env is set.
 */

import { Capacitor } from "@capacitor/core";
import { isNativeApp } from "@/lib/capacitor";
import { registerPushDevice, unregisterPushDevice } from "@/lib/push/api";

function nativePlatform(): "ios" | "android" | null {
  if (!isNativeApp()) return null;
  const p = Capacitor.getPlatform();
  if (p === "ios" || p === "android") return p;
  return null;
}

export async function enableNativePush(accessToken: string): Promise<{ ok: boolean; error?: string }> {
  const platform = nativePlatform();
  if (!platform) return { ok: true }; // not native — nothing to do

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === "prompt") {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== "granted") {
      return { ok: false, error: "Notification permission denied" };
    }

    const token = await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timed out waiting for push token")), 15000);
      void PushNotifications.addListener("registration", (t) => {
        clearTimeout(timeout);
        resolve(t.value);
      });
      void PushNotifications.addListener("registrationError", (err) => {
        clearTimeout(timeout);
        reject(new Error(err.error ?? "Push registration failed"));
      });
      void PushNotifications.register();
    });

    const res = await registerPushDevice({
      data: {
        accessToken,
        platform,
        token,
        userAgent: `capacitor/${platform}`,
      },
    });
    return res.ok ? { ok: true } : { ok: false, error: res.error };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Native push registration failed",
    };
  }
}

export async function disableNativePush(accessToken: string): Promise<{ ok: boolean; error?: string }> {
  const platform = nativePlatform();
  if (!platform) return { ok: true };

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    await PushNotifications.removeAllListeners();
  } catch {
    // plugin optional
  }

  try {
    const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
    const client = getSupabaseBrowserClient();
    if (!client) return { ok: true };
    const {
      data: { user },
    } = await client.auth.getUser(accessToken);
    if (!user) return { ok: false, error: "Not authenticated" };
    const { error } = await client
      .from("push_devices")
      .delete()
      .eq("user_id", user.id)
      .eq("platform", platform);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not disable native push",
    };
  }
}

/** Clear a specific native token from the server when known. */
export async function unregisterNativeToken(
  accessToken: string,
  token: string,
): Promise<{ ok: boolean; error?: string }> {
  const platform = nativePlatform();
  if (!platform) return { ok: true };
  const res = await unregisterPushDevice({
    data: { accessToken, token, platform },
  });
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}
