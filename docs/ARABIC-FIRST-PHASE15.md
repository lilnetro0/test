# Arabic-first Phase 15 — Profile search norms

**Status:** Done  
**Date:** 2026-07-15  
**Track:** Arabic-first (AF15)

## Goals

Fold profile username / display_name for people lookup (profile routes, friend add, admin lookup).

## Done

| Item | Detail |
|------|--------|
| Migration | `20260715280000_af15_profile_search_norm.sql` |
| Columns | `username_search_norm`, `display_name_search_norm` + triggers + gin_trgm |
| Client | `fetchProfileByUsername` + friend-by-tag use norms; display_name ilike fallback |
| Admin | `adminLookupUser` matches `username_search_norm` |

## Ops

Apply migration per env; `verify_schema.sql` expects the new columns/trigger.

## Deferred

- Dedicated people search API / typeahead  
- Arabic usernames (product still Latin `#tag` handles)  

## Arabic-first impact

| Area | Note |
|------|------|
| Search | Arabic display names findable when browsing by name |
| Unresolved | Full people directory UX |
