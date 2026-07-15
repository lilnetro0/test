# Arabic-first Phase 7 — Admin Games i18n, in-hub LFG jump, font trim

**Status:** Done  
**Date:** 2026-07-15  
**Track:** Arabic-first (AF7)

## Goals

1. Localize admin Games tab (fields, actions, toasts) + hub create/update toasts  
2. In-hub jump to `#lfg` / البحث عن فريق + LFG badge in channel list  
3. Trim Google Font weights (mid-range MENA load)

## Done

| Item | Detail |
|------|--------|
| Games admin | `admin.games.*` keys wired in `GamesTab` |
| Hub toasts | `admin.toast.hubSaved` / `hubCreated` |
| LFG jump | Channel sheet CTA + badge; `TextChannel.slug` from API |
| Fonts | Inter/Noto weights reduced to 400+600 (Space Grotesk 500+700 kept) |

## Deferred

- Exhaustive admin confirm dialogs EN  
- Full LFG events board  
- Self-hosted / subset woff2  

## Arabic-first impact

| Area | Note |
|------|------|
| Arabic UI | Games admin + LFG jump |
| Mobile perf | Fewer font files from Google CSS |
| Unresolved | Confirm strings; font self-host |
