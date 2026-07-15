# Arabic-first Phase 5 — Admin chrome i18n + bilingual document titles

**Status:** Done  
**Date:** 2026-07-15  
**Track:** Arabic-first (AF5)

## Goals

1. Localize admin shell (title, tabs, health chips, deny/checking, primary hub/channel labels)  
2. Bilingual route document titles via `translateStatic` + `ROUTE_TITLE_KEYS` sync on lang/path change  

## Done

| Item | Detail |
|------|--------|
| Admin shell | `admin.*` keys; tabs/header/health; hubs create fields; MENA template CTA; platform admins title |
| Titles | `meta.page.*` EN/AR; `head` uses `translateStatic`; `__root` LocalizedShell updates `document.title` |
| Helpers | `resolveHeadLang`, `translateStatic`, `ROUTE_TITLE_KEYS` in `i18n.tsx` |

## Deferred

- Every admin toast / Games tab field microcopy  
- Full SSR React string hydrate (titles follow cookie/html; first SSR paint may still EN)  
- Voice report attach; font subset  

## Arabic-first impact

| Area | Note |
|------|------|
| Arabic UI | Admin chrome + page titles |
| RTL | Admin inherits `html dir`; `ms-auto` on health row |
| Bidi | Unchanged |
| Search | Unchanged |
| Moderation | Reports already localized (AF3) |
| Unresolved | Residual admin EN toasts/Games forms |
