# Arabic-first Phase 6 — Discover LFG filter

**Status:** Done  
**Date:** 2026-07-15  
**Track:** Arabic-first (AF6)

## Goals

Thin LFG discovery slice without exposing private `text_channels` rows (member-only RLS).

1. `hubs.has_lfg` boolean + trigger sync when `#lfg` channels change  
2. Discover chip “Looking for group” / البحث عن فريق  
3. Empty-state copy when no LFG hubs  

## Done

| Item | Detail |
|------|--------|
| Migration | `20260715250000_af6_hub_has_lfg.sql` |
| Mapping | `HubCard.hasLfg` from `has_lfg`; mock MENA hubs marked |
| Discover | Toggle filter + empty state |

## Ops

Apply AF6 migration on each Supabase env (after AF2 region + AF3 templates recommended).

## Deferred

- In-hub LFG composer / events board  
- Voice report attach  
- Hub catalog `search_norm`  
- Font / mid-range perf  

## Arabic-first impact

| Area | Note |
|------|------|
| Arabic UI | LFG chip + empty copy |
| Regional discovery | Complements AF2 region filters |
| Moderation | Unchanged |
| Unresolved | Richer LFG product still open |
