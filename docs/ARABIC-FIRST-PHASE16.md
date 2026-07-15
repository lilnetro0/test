# Arabic-first Phase 16 — Cookie SSR lang/dir on HTML shell

**Status:** Done  
**Date:** 2026-07-15  
**Track:** Arabic-first (AF16)

## Goals

Serve `<html lang dir>` and default OG/title meta from `nexus.lang` cookie (Accept-Language fallback) so Arabic users do not get an English LTR shell flash before the bootstrap script.

## Done

| Item | Detail |
|------|--------|
| `resolveRequestLang` | Server helper via `getCookie` / `accept-language` |
| Root shell | `lang` + `dir` on `<html>` + `suppressHydrationWarning` |
| Root `head` | `translateStatic(meta.*, lang)` for title/description/OG |
| Bootstrap | Still syncs localStorage → cookie → AR browser/MENA |

## Deferred

- Full React tree SSR of Arabic strings (providers still hydrate client-side)  
- Set cookie from server when only Accept-Language is present  

## Arabic-first impact

| Area | Note |
|------|------|
| UX | First HTML paint respects stored AR preference |
| Unresolved | SSR of chrome copy inside LanguageProvider |
