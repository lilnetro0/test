# Arabic-first / MENA repository audit — Nexus

**Phase:** 0 re-audit (Arabic-first product direction)  
**Date:** 2026-07-15  
**Mode:** Planning + code audit only — **no product implementation in this pass**  
**Policy:** [`ARABIC-PRODUCT-GUIDELINES.md`](ARABIC-PRODUCT-GUIDELINES.md) · [`ARABIC-TERMINOLOGY.md`](ARABIC-TERMINOLOGY.md) · [`RTL-TEST-CHECKLIST.md`](RTL-TEST-CHECKLIST.md) · [`MENA-MODERATION-GUIDE.md`](MENA-MODERATION-GUIDE.md) · [`I18N-RTL.md`](I18N-RTL.md)

This document is the Phase 0 deliverable for evaluating the current codebase against Arabic-first / MENA requirements. It extends (does not replace) the original Phase 0 baseline in [`ARCHITECTURE-AUDIT.md`](ARCHITECTURE-AUDIT.md).

---

## Status by axis

| # | Axis | Status | Summary |
|---|------|--------|---------|
| 1 | Arabic-first UX | **Partial → improved (AF1/AF2)** | Dual EN/AR dict + auth toggle + browser detect; **rate-limit AR/EN**; **region prefs + MENA locale hint**; EN leftovers remain (SSR/head, admin chrome); DB `lang` default `en` |
| 2 | RTL layout | **Partial** | Core shell/dock/chat OK; unused/low-traffic `ui/*` still physical left/right |
| 3 | Mixed-direction (bidi) text | **Partial → improved (AF1)** | Messages + discover + **composer, notifications, report, admin report UGC** use `dir="auto"` |
| 4 | Arabic search | **Partial → improved (AF1/AF4)** | Client fold + aliases + **DB `body_search_norm` + trigram**; keep JS/SQL fold rules aligned |


| 5 | MENA moderation | **Partial → improved (AF3)** | Assist chips + response templates + Reports i18n; no auto-ban; full admin chrome still EN elsewhere |
| 6 | Regional discovery | **Partial → improved (AF2/AF3)** | Prefs + hub region + Discover + **Arabic channel templates**; LFG product still thin |
| 7 | Mobile performance (AR/MENA) | **Partial** | Noto + Cap keyboard/safe-area; multi-webfont cold load; no mid-range budget or Arabic subset strategy |

**Overall:** Foundations in place through **AF4** (bidi, region discover, hub templates, moderation assist, DB search norm). Remaining: fuller admin i18n, LFG product, SSR hydrate, font/perf.

---

## 1. Arabic-first UX

### Shipped

| Item | Evidence |
|------|----------|
| EN/AR dictionary | `src/lib/i18n.tsx` — nav, chat, voice, auth, legal, reports, settings, onboarding |
| Language resolution | Storage → cookie → `navigator` `ar*` → `en` (`resolveClientLang`); **region step not implemented** |
| Pre-paint RTL | `LANG_BOOTSTRAP` in `src/routes/__root.tsx` |
| Auth language toggle | `src/components/auth-shell.tsx` — EN \| العربية before onboarding |
| Prefs sync | `user_prefs.lang`; `auth-provider.tsx` + Settings language section |
| Guidelines / terms bilingual | i18n keys + `/guidelines`, `/terms` |

### Gaps

- SSR / initial React strings can flash EN; route `head` titles often hardcoded EN.
- `user_prefs.lang` defaults to `'en'` in schema — product Arabic-first is client detect, not DB default.
- Usernames constrained to Latin (`^[A-Za-z0-9_]+$`); Arabic display names may exist on other fields only.
- `src/lib/rate-limit.ts` mapped errors are English-only user-facing strings.
- `src/routes/admin.tsx` largely English (known deferred surface).

---

## 2. RTL

### Shipped

- `LanguageProvider` sets `html.lang` / `html.dir`.
- Dock / app shell use `ltr:` / `rtl:` and logical props (`ms-`, `me-`, `end-`, `text-start`).
- High-traffic sheet/dialog close use logical `end-*`.
- `html[lang="ar"] .uppercase` override in `src/styles.css`.
- Safe-area + Cap keyboard inset (`use-keyboard-inset.ts`, `docs/MOBILE.md`).

### Gaps

- Physical Tailwind remains in several shadcn leftovers (`context-menu`, `menubar`, `select`, `alert`, `carousel`, `command` — `ml-`/`pl-`/`left-`/`right-`).
- Sheet side slide variants still use physical `left-0` / `right-0`.
- Admin uses some `ml-auto`. Exhaustive remirroring deferred per `I18N-RTL.md`.

---

## 3. Mixed-direction (bidi) text

### Shipped

- `dir="auto"` on message author, body, reply snippet, system text — `src/components/message-item.tsx`.
- Discover hub titles / topics — `src/routes/discover.tsx`.

### Gaps (verified)

- Composer input + reply author: **no** `dir="auto"` (`src/components/composer.tsx`).
- Notifications list title/body: **no** `dir="auto"` (`src/routes/notifications.tsx`).
- Report dialog preview: **no** isolated bidi (`src/components/report-dialog.tsx`).
- Admin report details / usernames: **no** isolation.
- Push payloads rely on OS bidi; in-app notification chrome does not isolate.

---

## 4. Arabic search

### Shipped

- `src/lib/arabic-normalize.ts` — tatweel, diacritics, alef/yeh/teh-marbuta fold, Arabic-Indic digits.
- `GAME_SEARCH_ALIASES` for common titles (Valorant, PUBG, FIFA, …).
- Unit tests: `src/lib/arabic-normalize.test.ts`.
- Discover client filter: `discover.tsx` `hubMatchesQuery`.
- Channel message search folds query then `ilike` on `body` (`src/lib/chat/api.ts`).

### Gaps

- Fold is applied to the **query**; stored bodies are not pre-normalized → `ilike` miss risk for diacritic-rich messages.
- No generated / indexed normalized column in Postgres.
- Message search does not apply game aliases.
- No profile / global Arabic hub search beyond catalog filter.

---

## 5. MENA moderation

### Shipped

- Report dialog reasons + copy via `t()`; guidelines page AR content; terms 13+ EN+AR.
- Register DOB gate ≥13 (`register.tsx`).
- Reports table + admin review queue (Phase 9).
- Playbook: `docs/MENA-MODERATION-GUIDE.md`.

### Gaps

- **No Arabizi / Arabic profanity / assist filters in code** — documentation only.
- Admin: English chrome; report body without `dir="auto"`; no language/region queue filters; no Arabic moderator response templates.
- **No appeal UX or strings** in the app.
- Age not stored after register gate → cannot enforce age-aware DM/privacy defaults from guidelines.
- Some API / rate-limit user errors remain English.

---

## 6. Regional discovery

### Status: Missing vs guidelines

| Expected (guidelines) | Repo reality |
|-----------------------|--------------|
| Country / region filters | Discover categories = game genres only (`discover.tsx`) |
| Profile country / play region | `profiles` / `user_prefs` have **no** country/region columns |
| Arabic hub channel templates | Not implemented (terminology lists as future) |
| Regional LFG / events | Not found |
| Locale region fallback | Documented TBD in `i18n.tsx` / guidelines |

Product docs exist; shipping surface is **global genre discover**.

---

## 7. Mobile performance (Arabic / MENA)

### Shipped

- Noto Sans Arabic via Google Fonts (`display=swap`) + CSS stack after Inter / Space Grotesk.
- Cap keyboard inset, `viewport-fit=cover`, safe-area utilities.
- i18n is a single dual-locale dict (no lazy locale split) — acceptable at current size.

### Gaps

- Three webfonts on cold MENA networks; no documented Arabic-only subset or mid-range device budget beyond policy text.
- Capacitor remote shell / 4.2 risk is launch-general, not Arabic-specific, but affects MENA mobile experience.

---

## Ranked gaps (highest product impact first)

1. **Regional / MENA discovery absent** — no country filters, profile region, hub templates, LFG/events.  
2. **Arabic moderation assist missing** — human queue only; admin not bidi-safe or i18n’d; no appeals.  
3. **Search recall incomplete** — fold without DB-normalized index; aliases limited to discover.  
4. **Bidi incomplete for UGC chrome** — composer, notifications, reports, admin.  
5. **English leftovers on user paths** — rate-limit toasts, SSR/head titles, admin, Latin-only usernames.  
6. **Locale resolution incomplete** — no region fallback; DB default `lang=en`.  
7. **RTL debt in rarely used `ui/*`** — physical directional classes.  
8. **Font/perf strategy** — multi-webfont cold start on mid-range mobile.

---

## Already shipped (preserve)

Standing MENA docs + glossary + RTL checklist · `LanguageProvider` + bootstrap · auth language toggle · prefs sync · Noto + `lang=ar` uppercase fix · message + discover `dir="auto"` · Arabic search normalize + aliases + tests · localized reports/guidelines/legal · 13+ register · voice/dock/chat chrome i18n · Cap keyboard/safe-area · Cloudflare client build fix (health + push send split).

---

## Phase 0 Arabic-first definition of done (this pass)

- [x] Planning docs require Arabic-first axes in Phase 0 scope  
- [x] Code audited against the seven axes above  
- [x] Findings recorded here + linked from hardening plan / matrix / architecture audit  
- [ ] **Out of scope:** implementing gaps (await approval for a follow-on phase)

---

## Arabic-first impact (Phase 0 re-audit)

| Area | Note |
|------|------|
| Arabic UI | Documented Partial; no new UI shipped this pass |
| RTL testing | Checklist already exists; audit notes remaining physical CSS |
| Mixed-direction | Gaps listed with file paths |
| Arabic search | Helper present; DB index gap recorded |
| Moderation | Docs + report UX Partial; assist Missing |
| Unresolved | Entire ranked gap list — backlog only until a new phase is opened |
