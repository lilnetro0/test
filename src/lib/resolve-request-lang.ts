/**
 * Server-only: resolve UI language from request cookie / Accept-Language.
 * Import only from SSR entry points (e.g. root shell / head) — not client components.
 */
import { getCookie, getRequestHeader, setCookie } from "@tanstack/react-start/server";

export type RequestLang = "en" | "ar";

const COOKIE = "nexus.lang";

export function resolveRequestLang(): RequestLang {
  try {
    const cookie = getCookie(COOKIE);
    if (cookie === "ar" || cookie === "en") return cookie;
  } catch {
    /* no request event */
  }

  let fromHeader: RequestLang | null = null;
  try {
    const header = (getRequestHeader("accept-language") ?? "").toLowerCase();
    if (header.startsWith("ar") || /(^|,)\s*ar([-;,]|$)/.test(header)) fromHeader = "ar";
  } catch {
    /* no request event */
  }

  const lang: RequestLang = fromHeader ?? "en";

  // Persist Accept-Language hint so subsequent visits / client hydrate stay aligned.
  if (fromHeader) {
    try {
      setCookie(COOKIE, fromHeader, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    } catch {
      /* ignore */
    }
  }

  return lang;
}
