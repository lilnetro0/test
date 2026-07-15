/** Map PostgREST / Postgres rate_limited:* errors to short user-facing copy. */

export type RateLimitCode =
  | "edit"
  | "reaction"
  | "send"
  | "report_hour"
  | "report_target"
  | "friend"
  | "voice_mint"
  | "generic";

const RATE_COPY: Record<RateLimitCode, { en: string; ar: string }> = {
  edit: {
    en: "You're editing too fast. Wait a moment and try again.",
    ar: "تعدّل بسرعة كبيرة. انتظر لحظات ثم أعد المحاولة.",
  },
  reaction: {
    en: "You're reacting too fast. Slow down a bit.",
    ar: "تتفاعل بسرعة كبيرة. تمّهل قليلًا.",
  },
  send: {
    en: "You're sending too fast. Wait a moment and try again.",
    ar: "ترسل بسرعة كبيرة. انتظر لحظات ثم أعد المحاولة.",
  },
  report_hour: {
    en: "Too many reports this hour. Try again later.",
    ar: "بلاغات كثيرة هذه الساعة. حاول لاحقًا.",
  },
  report_target: {
    en: "You've already reported this enough for today.",
    ar: "أبلغت عن هذا بما يكفي اليوم.",
  },
  friend: {
    en: "Too many friend requests today. Try again tomorrow.",
    ar: "طلبات صداقة كثيرة اليوم. حاول غدًا.",
  },
  voice_mint: {
    en: "Too many voice joins. Wait a moment and try again.",
    ar: "انضمامات صوتية كثيرة. انتظر لحظات ثم أعد المحاولة.",
  },
  generic: {
    en: "Too many requests. Slow down and try again.",
    ar: "طلبات كثيرة. تمّهل ثم أعد المحاولة.",
  },
};

export function classifyRateLimitError(message: string | undefined | null): RateLimitCode | null {
  if (!message) return null;
  const m = message.toLowerCase();
  if (!m.includes("rate_limited")) return null;
  if (m.includes("edit_")) return "edit";
  if (m.includes("reaction_")) return "reaction";
  if (m.includes("channel") || m.includes("dm_")) return "send";
  if (m.includes("report_hour")) return "report_hour";
  if (m.includes("report_target")) return "report_target";
  if (m.includes("friend")) return "friend";
  if (m.includes("voice_mint")) return "voice_mint";
  return "generic";
}

function resolveUiLang(explicit?: "en" | "ar"): "en" | "ar" {
  if (explicit) return explicit;
  if (typeof document !== "undefined" && document.documentElement.lang === "ar") return "ar";
  return "en";
}

/** English copy (stable for unit tests / ops). Prefer `withMappedDbError` for UI. */
export function mapRateLimitError(message: string | undefined | null): string | null {
  const code = classifyRateLimitError(message);
  return code ? RATE_COPY[code].en : null;
}

/** Map DB errors for toasts; rate limits follow `html[lang]` (Arabic-first). */
export function withMappedDbError(
  message: string | undefined | null,
  fallback: string,
  lang?: "en" | "ar",
): string {
  const code = classifyRateLimitError(message);
  if (code) return RATE_COPY[code][resolveUiLang(lang)];
  return message?.trim() || fallback;
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
