/**
 * Optional FCM legacy HTTP send for Cap Android tokens.
 * Prefer migrating to HTTP v1 later; this is fail-soft when FCM_SERVER_KEY unset.
 */
export function fcmConfigured(): { serverKey: string } | null {
  const serverKey = (process.env.FCM_SERVER_KEY as string | undefined)?.trim() ?? "";
  if (!serverKey) return null;
  return { serverKey };
}

export async function sendFcmAlert(
  deviceToken: string,
  payload: { title: string; body?: string; href?: string | null },
): Promise<{ ok: true } | { ok: false; error: string; stale?: boolean }> {
  const cfg = fcmConfigured();
  if (!cfg) return { ok: false, error: "fcm_not_configured" };

  try {
    const res = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        Authorization: `key=${cfg.serverKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: deviceToken,
        notification: {
          title: payload.title,
          body: payload.body ?? "",
        },
        data: {
          href: payload.href ?? "/notifications",
        },
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      success?: number;
      failure?: number;
      results?: { error?: string }[];
    };
    if (!res.ok) {
      return { ok: false, error: `fcm_http_${res.status}` };
    }
    if (json.success && json.success > 0) return { ok: true };
    const err = json.results?.[0]?.error ?? "fcm_failed";
    const stale = err === "NotRegistered" || err === "InvalidRegistration";
    return { ok: false, error: err, stale };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "fcm_fetch_failed" };
  }
}
