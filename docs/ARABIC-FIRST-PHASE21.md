# Arabic-first Phase 21 — React SSR lang hydrate

**Status:** Done  
**Date:** 2026-07-15  
**Track:** Arabic-first (AF21)

## Goals

Make first React chrome strings match the AF16 `<html lang dir>` cookie/Accept-Language shell.

## Done

| Item | Detail |
|------|--------|
| `LanguageProvider` | Optional `initialLang` |
| Root / error | Pass `resolveShellLang()` into provider |
| Cookie persist | `resolveRequestLang` sets `nexus.lang` when only Accept-Language is AR |

## Arabic-first impact

| Area | Note |
|------|------|
| UX | Reduced EN flash for skip-link / error chrome on AR first paint |
| Unresolved | Full chat tree still client-hydrated (expected) |
