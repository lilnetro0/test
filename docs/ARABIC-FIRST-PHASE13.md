# Arabic-first Phase 13 — Catalog name_search_norm

**Status:** Done  
**Date:** 2026-07-15  
**Track:** Arabic-first (AF13)

## Goals

Extend AF4 Arabic search folding to hub / game catalog names for Discover and command palette.

## Done

| Item | Detail |
|------|--------|
| Migration | `20260715270000_af13_catalog_search_norm.sql` |
| Columns | `hubs.name_search_norm`, `games.name_search_norm` + triggers + gin_trgm |
| Client | `mapHubRowToLiveHub` maps norms onto `HubCard` |
| Match helper | `hubMatchesQuery` in `src/lib/hub-search.ts` (Discover) |

## Ops

Apply migration per env; `verify_schema.sql` expects the new columns/triggers.

## Deferred

- Server-side Discover filter (ilike on norms) — client still filters full catalog  
- profiles.username_search_norm  

## Arabic-first impact

| Area | Note |
|------|------|
| Search | Folded hub/game names aligned with message search |
| Unresolved | Server-side catalog filter at scale |
