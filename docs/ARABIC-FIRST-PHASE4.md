# Arabic-first Phase 4 — DB-normalized Arabic search

**Status:** Done  
**Date:** 2026-07-15  
**Track:** Arabic-first (AF4)  
**Policy:** [`ARABIC-PRODUCT-GUIDELINES.md`](ARABIC-PRODUCT-GUIDELINES.md) · Audit: [`ARABIC-FIRST-AUDIT.md`](ARABIC-FIRST-AUDIT.md)

## Goals

Close audit **Arabic search recall** gap (#3): store a folded search column so diacritic / tatweel / alef-variant bodies match folded queries — without rewriting display `body` (moderation-safe).

1. Postgres `normalize_arabic_for_search` aligned with `src/lib/arabic-normalize.ts`  
2. `messages.body_search_norm` + `dm_messages.body_search_norm` + triggers + backfill  
3. Trigram indexes (`pg_trgm`) for `ilike %term%`  
4. Channel message search queries `body_search_norm` via `expandArabicSearchNormTerms`

## Done

| Item | Detail |
|------|--------|
| Migration | `20260715240000_af4_arabic_search_norm.sql` |
| Client search | `chat/api.ts` OR-filter on `body_search_norm` |
| Helpers | `expandArabicSearchNormTerms` + unit tests |
| Types / verify | `types.ts`, `verify_schema.sql`, migrations README |

## Ops

Apply migration on each Supabase env, then run `verify_schema.sql` (expect `messages.body_search_norm`, `dm_messages.body_search_norm`).

## Explicitly deferred

- Full admin i18n  
- Voice report attach  
- LFG product UX beyond channel templates  
- SSR/head bilingual hydrate  
- Hub/catalog DB search_norm columns  
- Font subset / mid-range perf budget  

## Arabic-first impact

| Area | Note |
|------|------|
| Arabic UI | Unchanged chrome |
| RTL | N/A |
| Bidi | Unchanged |
| Arabic search | DB fold + trigram; aliases still via client expand |
| ModerATION | Original `body` preserved; norm is search-only |
| Unresolved | See deferred list |
