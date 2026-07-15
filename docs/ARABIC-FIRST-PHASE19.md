# Arabic-first Phase 19 — Thin in-hub LFG board

**Status:** Done  
**Date:** 2026-07-15  
**Track:** Arabic-first (AF19)

## Goals

Surface open looking-for-group posts when the user is in an `#lfg` channel — no events table.

## Done

| Item | Detail |
|------|--------|
| Helper | `selectLfgBoardPosts()` — recent root messages (≥8 chars, 24h) |
| UI | `LfgBoard` strip above chat (collapsible cards + reply) |
| Home | Shown when `isLfgChannel(activeChannel)` |

## Deferred (product follow-up, not Arabic-first gap)

- Dedicated `lfg_posts` / RSVP / party size events schema  
- Cross-hub LFG directory  

## Arabic-first impact

| Area | Note |
|------|------|
| UX | AR-first board chrome + `dir="auto"` on post body |
| Unresolved | Full events product (optional later) |
