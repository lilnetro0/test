/** Map PostgREST / Postgres rate_limited:* errors to short user-facing copy. */
export function mapRateLimitError(message: string | undefined | null): string | null {
  if (!message) return null;
  const m = message.toLowerCase();
  if (!m.includes("rate_limited")) return null;
  if (m.includes("edit_")) {
    return "You're editing too fast. Wait a moment and try again.";
  }
  if (m.includes("reaction_")) {
    return "You're reacting too fast. Slow down a bit.";
  }
  if (m.includes("channel") || m.includes("dm_")) {
    return "You're sending too fast. Wait a moment and try again.";
  }
  if (m.includes("report_hour")) {
    return "Too many reports this hour. Try again later.";
  }
  if (m.includes("report_target")) {
    return "You've already reported this enough for today.";
  }
  if (m.includes("friend")) {
    return "Too many friend requests today. Try again tomorrow.";
  }
  if (m.includes("voice_mint")) {
    return "Too many voice joins. Wait a moment and try again.";
  }
  return "Too many requests. Slow down and try again.";
}

export function withMappedDbError(message: string | undefined | null, fallback: string): string {
  return mapRateLimitError(message) ?? (message?.trim() || fallback);
}

const COOLDOWN_PREFIX = "nexus:auth-cooldown:";

/** Client-only auth cooldown (seconds). Not a substitute for Supabase Auth platform limits. */
export function checkAuthCooldown(action: string, seconds: number): { ok: true } | { ok: false; retryInSec: number } {
  if (typeof sessionStorage === "undefined") return { ok: true };
  const key = COOLDOWN_PREFIX + action;
  const last = Number(sessionStorage.getItem(key) || "0");
  const elapsed = (Date.now() - last) / 1000;
  if (last && elapsed < seconds) {
    return { ok: false, retryInSec: Math.ceil(seconds - elapsed) };
  }
  return { ok: true };
}

export function markAuthCooldown(action: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(COOLDOWN_PREFIX + action, String(Date.now()));
}
