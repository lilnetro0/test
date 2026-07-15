/**
 * Resolve UI language from cookie / Accept-Language (SSR) or document.cookie (client).
 * Uses createIsomorphicFn so `@tanstack/react-start/server` is DCE'd from the client build.
 */
import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie, getRequestHeader, setCookie } from "@tanstack/react-start/server";

export type RequestLang = "en" | "ar";

const COOKIE = "nexus.lang";

function parseCookieLang(raw: string | undefined | null): RequestLang | null {
  if (raw === "ar" || raw === "en") return raw;
  return null;
}

function acceptLanguageIsArabic(header: string): boolean {
  const h = header.toLowerCase();
  return h.startsWith("ar") || /(^|,)\s*ar([-;,]|$)/.test(h);
}

export const resolveRequestLang = createIsomorphicFn()
  .server((): RequestLang => {
    try {
      const fromCookie = parseCookieLang(getCookie(COOKIE));
      if (fromCookie) return fromCookie;
    } catch {
      /* no request event */
    }

    let fromHeader: RequestLang | null = null;
    try {
      const header = getRequestHeader("accept-language") ?? "";
      if (acceptLanguageIsArabic(header)) fromHeader = "ar";
    } catch {
      /* no request event */
    }

    const lang: RequestLang = fromHeader ?? "en";

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
  })
  .client((): RequestLang => {
    try {
      const m = document.cookie.match(/(?:^|; )nexus\.lang=([^;]*)/);
      const c = m ? decodeURIComponent(m[1]) : null;
      const fromCookie = parseCookieLang(c);
      if (fromCookie) return fromCookie;
    } catch {
      /* ignore */
    }
    return "en";
  });
