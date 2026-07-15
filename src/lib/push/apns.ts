import { createPrivateKey, sign } from "node:crypto";

type ApnsConfig = {
  keyId: string;
  teamId: string;
  bundleId: string;
  p8Pem: string;
  production: boolean;
};

export function apnsConfigured(): ApnsConfig | null {
  const keyId = (process.env.APNS_KEY_ID as string | undefined)?.trim() ?? "";
  const teamId = (process.env.APNS_TEAM_ID as string | undefined)?.trim() ?? "";
  const bundleId =
    (process.env.APNS_BUNDLE_ID as string | undefined)?.trim() || "com.lilnetro0.nexus";
  const p8 =
    (process.env.APNS_P8 as string | undefined)?.trim() ||
    (process.env.APNS_P8_BASE64
      ? Buffer.from(String(process.env.APNS_P8_BASE64), "base64").toString("utf8")
      : "");
  if (!keyId || !teamId || !p8) return null;
  const production =
    (process.env.APNS_PRODUCTION as string | undefined)?.trim() === "1" ||
    (process.env.APNS_PRODUCTION as string | undefined)?.trim()?.toLowerCase() === "true" ||
    process.env.NODE_ENV === "production";
  return { keyId, teamId, bundleId, p8Pem: normalizeP8(p8), production };
}

function normalizeP8(raw: string): string {
  let pem = raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
  if (!pem.includes("BEGIN PRIVATE KEY")) {
    pem = `-----BEGIN PRIVATE KEY-----\n${pem.replace(/\s+/g, "\n").trim()}\n-----END PRIVATE KEY-----`;
  }
  return pem;
}

function b64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64url");
}

function mintApnsJwt(cfg: ApnsConfig): string {
  const header = b64url(JSON.stringify({ alg: "ES256", kid: cfg.keyId }));
  const now = Math.floor(Date.now() / 1000);
  const claims = b64url(JSON.stringify({ iss: cfg.teamId, iat: now }));
  const unsigned = `${header}.${claims}`;
  const key = createPrivateKey(cfg.p8Pem);
  const sig = sign("sha256", Buffer.from(unsigned), { key, dsaEncoding: "ieee-p1363" });
  return `${unsigned}.${b64url(sig)}`;
}

/**
 * Send a visible alert via Apple Push Notification service (token auth).
 * No-op config → returns skipped. CallKit / VoIP push stays deferred.
 */
export async function sendApnsAlert(
  deviceToken: string,
  payload: { title: string; body?: string; href?: string | null },
): Promise<{ ok: true } | { ok: false; status?: number; error: string; stale?: boolean }> {
  const cfg = apnsConfigured();
  if (!cfg) return { ok: false, error: "apns_not_configured" };

  const token = deviceToken.replace(/\s+/g, "");
  if (!/^[0-9a-fA-F]{64}$/.test(token) && token.length < 32) {
    return { ok: false, error: "invalid_device_token", stale: true };
  }

  let jwt: string;
  try {
    jwt = mintApnsJwt(cfg);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "apns_jwt_failed" };
  }

  const host = cfg.production ? "api.push.apple.com" : "api.sandbox.push.apple.com";
  const url = `https://${host}/3/device/${token}`;
  const body = {
    aps: {
      alert: {
        title: payload.title,
        body: payload.body ?? "",
      },
      sound: "default",
    },
    href: payload.href ?? "/notifications",
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `bearer ${jwt}`,
        "apns-topic": cfg.bundleId,
        "apns-push-type": "alert",
        "apns-priority": "10",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (res.status === 200) return { ok: true };
    const text = await res.text().catch(() => "");
    const stale = res.status === 410 || res.status === 400;
    return {
      ok: false,
      status: res.status,
      error: text || `apns_http_${res.status}`,
      stale,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "apns_fetch_failed" };
  }
}
