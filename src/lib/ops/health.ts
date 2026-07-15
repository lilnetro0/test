import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type AppHealthReport = {
  ok: boolean;
  env: "production" | "development";
  ts: string;
  supabase: {
    ok: boolean;
    configured: boolean;
    games?: number;
    message?: string;
  };
  livekit: {
    configured: boolean;
    urlHost: string | null;
    /** HTTPS GET `/` probe when configured; null when unset. */
    reachable: boolean | null;
    probeMs?: number;
    message?: string;
  };
};

function getLiveKitBase(): { configured: boolean; url: string | null; urlHost: string | null } {
  const url = (process.env.LIVEKIT_URL as string | undefined)?.trim() || null;
  const apiKey = (process.env.LIVEKIT_API_KEY as string | undefined)?.trim();
  const apiSecret = (process.env.LIVEKIT_API_SECRET as string | undefined)?.trim();
  const configured = Boolean(url && apiKey && apiSecret);
  let urlHost: string | null = null;
  if (url) {
    try {
      urlHost = new URL(url).host;
    } catch {
      urlHost = "set";
    }
  }
  return { configured, url, urlHost };
}

/**
 * Light SFU reachability: HTTPS GET `/` on LiveKit host (health returns 200 OK / 406 Not Ready).
 * Not a TURN/ICE synthetic — still deferred.
 */
async function probeLiveKitHttp(wsUrl: string): Promise<{
  reachable: boolean;
  probeMs: number;
  message?: string;
}> {
  const started = Date.now();
  let httpUrl: string;
  try {
    const u = new URL(wsUrl);
    if (u.protocol === "wss:") u.protocol = "https:";
    else if (u.protocol === "ws:") u.protocol = "http:";
    u.pathname = "/";
    u.search = "";
    u.hash = "";
    httpUrl = u.toString();
  } catch {
    return { reachable: false, probeMs: 0, message: "Invalid LIVEKIT_URL" };
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(httpUrl, {
      method: "GET",
      signal: ctrl.signal,
      redirect: "follow",
    });
    clearTimeout(timer);
    // 200 = healthy; 406 = node present but not ready — still reachable
    const reachable = res.status === 200 || res.status === 406;
    return {
      reachable,
      probeMs: Date.now() - started,
      message: reachable ? undefined : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      reachable: false,
      probeMs: Date.now() - started,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Dual health: Supabase (fail closed for readiness) + LiveKit config/reachability (informational).
 * Never returns secrets.
 */
export async function collectAppHealth(): Promise<AppHealthReport> {
  const env =
    process.env.NODE_ENV === "production" ? ("production" as const) : ("development" as const);
  const base = getLiveKitBase();

  let livekit: AppHealthReport["livekit"] = {
    configured: base.configured,
    urlHost: base.urlHost,
    reachable: null,
  };

  if (base.configured && base.url) {
    const probe = await probeLiveKitHttp(base.url);
    livekit = {
      configured: true,
      urlHost: base.urlHost,
      reachable: probe.reachable,
      probeMs: probe.probeMs,
      message: probe.message,
    };
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return {
      ok: false,
      env,
      ts: new Date().toISOString(),
      supabase: {
        ok: false,
        configured: false,
        message: "Service role not configured",
      },
      livekit,
    };
  }

  const { count, error } = await admin.from("games").select("*", { count: "exact", head: true });
  if (error) {
    return {
      ok: false,
      env,
      ts: new Date().toISOString(),
      supabase: {
        ok: false,
        configured: true,
        message: error.message,
      },
      livekit,
    };
  }

  return {
    ok: true,
    env,
    ts: new Date().toISOString(),
    supabase: {
      ok: true,
      configured: true,
      games: count ?? 0,
    },
    livekit,
  };
}
