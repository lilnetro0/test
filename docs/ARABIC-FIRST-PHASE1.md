# Arabic-first Phase 1 — UX foundations

**Status:** Done  
**Date:** 2026-07-15  
**Track:** Arabic-first (post Phase 0 audit) — not a re-run of hardening Phase 1  
**Policy:** [`ARABIC-PRODUCT-GUIDELINES.md`](ARABIC-PRODUCT-GUIDELINES.md) · Audit: [`ARABIC-FIRST-AUDIT.md`](ARABIC-FIRST-AUDIT.md)

## Goals

Close the highest-leverage **incremental** gaps from the Phase 0 Arabic-first audit without starting MENA discovery or moderation assist mega-features:

1. Complete `dir="auto"` on high-traffic UGC chrome (composer, notifications, report dialog, admin report details)  
2. Bilingual rate-limit toast copy (follow `html[lang]`)  
3. Message search: alias expand + client haystack fold filter (still no DB normalize column)

## Done

| Item | Detail |
|------|--------|
| Composer bidi | Input, reply author, mentions, typing, attachment name — `dir="auto"` |
| Notifications | Title + body `dir="auto"` |
| Report dialog | Preview + details textarea |
| Admin reports | Details, reporter/target usernames, resolution note |
| Rate limits | `RATE_COPY` EN+AR; `withMappedDbError(..., lang?)` uses `document.documentElement.lang` |
| Search | `expandArabicSearchTerms`; channel search OR-ilike + `arabicSearchIncludes` over expanded terms |
| Tests | `rate-limit.test.ts`, `arabic-normalize.test.ts` (alias expand) |

## Explicitly deferred (later AF phases)

- Regional / MENA discovery (country filters, profile region, hub templates)  
- Arabic moderation assist / Arabizi filters / appeals  
- DB generated normalized search column  
- Full admin i18n  
- Region locale fallback step  
- SSR/head title bilingual hydrate  
- Exhaustive `ui/*` physical → logical CSS  

## Arabic-first impact

| Area | Note |
|------|------|
| Arabic UI | Rate-limit AR copy when `lang=ar` |
| RTL testing | Use `RTL-TEST-CHECKLIST.md` on composer + notifications |
| Mixed-direction | Composer / notifs / report / admin report UGC isolated |
| Arabic search | Aliases on message search; still Partial vs DB index |
| Moderation | Admin can read AR report details with bidi; assist still Missing |
| Unresolved | See deferred list + audit ranked gaps 1–2, 6–8 |
