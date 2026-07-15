# Arabic-first Phase 2 — Regional discovery foundations

**Status:** Done  
**Date:** 2026-07-15  
**Track:** Arabic-first (AF2)  
**Policy:** [`ARABIC-PRODUCT-GUIDELINES.md`](ARABIC-PRODUCT-GUIDELINES.md) · Audit: [`ARABIC-FIRST-AUDIT.md`](ARABIC-FIRST-AUDIT.md)

## Goals

Start the #1 audit gap (regional / MENA discovery) incrementally:

1. Persist player **home region** (`user_prefs.region`)  
2. Tag hubs with audience **region** (`hubs.region`)  
3. Discover **region chips** (All / MENA / my region / SA·AE·EG)  
4. Locale **region fallback** after prefs + browser (timezone / stored region / locale suffix → Arabic)

Not in AF2: hub channel templates, LFG/events, admin full region CRUD UI, IP geolocation.

## Done

| Item | Detail |
|------|--------|
| Migration | `20260715230000_af2_region_discovery.sql` — prefs + hubs `region`, seed tags |
| Lib | `src/lib/regions.ts` + unit tests |
| Settings | Home region picker next to language |
| Discover | Region filter chips + hub region badge |
| Locale | `resolveClientLang` + `LANG_BOOTSTRAP` MENA hint |
| Types / map | `HubCard.region`, prefs patch, live hub select |

## Arabic-first impact

| Area | Note |
|------|------|
| Arabic UI | Region labels EN/AR in settings + discover |
| RTL | Chips use flex-wrap; logical layout already |
| Bidi | Discover search `dir="auto"` |
| Arabic search | Unchanged from AF1 |
| Moderation | Unchanged |
| Unresolved | Hub templates, LFG, admin region editor, DB search column, MENA T&S assist |

## Operator note

Apply migration on each Supabase project, then `verify_schema.sql` (expects `hubs.region`, `user_prefs.region`).
