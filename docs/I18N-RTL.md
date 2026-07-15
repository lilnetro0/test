# Arabic, RTL, and accessibility — Nexus

**Phase:** 13 (+ Arabic-first AF1–AF22) · **Policy update:** Arabic-first (standing)  
**Date:** 2026-07-15

**Product policy (MENA / Arabic-first):** see  
[`ARABIC-PRODUCT-GUIDELINES.md`](ARABIC-PRODUCT-GUIDELINES.md) · [`ARABIC-TERMINOLOGY.md`](ARABIC-TERMINOLOGY.md) · [`RTL-TEST-CHECKLIST.md`](RTL-TEST-CHECKLIST.md) · [`MENA-MODERATION-GUIDE.md`](MENA-MODERATION-GUIDE.md)

## What shipped

| Piece | Role |
|-------|------|
| EN/AR dict | Chat/voice/toast/error/a11y + `meta.title` / `meta.description` |
| `LanguageProvider` | Sets `html lang`/`dir`; persists `nexus.lang` + cookie; AF21 `initialLang` SSR |
| First-visit auto-detect | `navigator.language` → `ar` when no stored preference |
| Early bootstrap | Inline script: storage → cookie → browser → `dir=rtl` before paint |
| Cookie SSR shell | AF16/AF21: `<html lang dir>` + root meta from cookie / Accept-Language |
| Runtime document meta | `document.title` + meta description follow language |
| Self-hosted fonts | AF18 Noto Arabic + AF20 Inter / Space Grotesk (`@fontsource`) |
| AR typography | `html[lang=ar] .uppercase` disables forced uppercase |
| Chat chrome | `message-item` menus/aria via `t()`; logical `me-` margins |
| High-traffic `ui/*` | Sheet/dialog/alert/drawer logical close + text-start; dropdown `ps`/`pe`/`start` |
| Voice dock | Control labels + toasts localized |
| User toasts | Hub/DM/friends/discover/composer success & error copy |
| a11y | Skip link; close panel / primary nav / emoji / error page localized |
| Auth lang toggle | EN | العربية on login/register shell (Arabic-first) |
| UGC `dir="auto"` | Messages + discover + composer/notifs/report/admin report (AF1) |
| Arabic search fold | Tatweel/diacritics/alef + discover + message aliases (AF1–AF4/AF13/AF15) |
| Rate-limit copy | EN+AR from `html[lang]` (AF1) |
| Thin LFG board | AF19 in-hub open posts from `#lfg` |

Also see [`ARABIC-FIRST-AUDIT.md`](ARABIC-FIRST-AUDIT.md) and phase docs AF1–AF22.

## How to verify

1. Clear `nexus.lang` storage/cookie; set browser language to Arabic → first load uses AR + RTL  
2. Settings → Language → العربية  
3. Confirm dock, hubs sheet, composer, message actions, voice dock flip RTL  
4. Pin/edit/delete/react and check toast language  
5. Tab to skip link; reduce-motion still honored  
6. Change language → tab title + meta description update  
7. Open `#lfg` → board strip + templates; fonts load without Google CDN  

### Manual a11y smoke (no axe CI)

- [ ] Skip link reaches `#main-content`  
- [ ] Icon-only controls announce names (message bar, voice dock, dock nav)  
- [ ] Dialog/sheet close control is reachable and mirrored in RTL  
- [ ] Focus rings visible on interactive controls  
- [ ] Reduce motion + high contrast toggles apply  

## Still deferred

- Dedicated LFG events / RSVP product (thin board shipped AF19)  
- Sidebar structural `data-side` physics (intentional)  
- Broader crawler OG beyond AF16 root head (route runtime titles already bilingual)  
- Automated axe / screen-reader CI suite  

**Arabic-first ranked gaps from Phase 0:** closed through **AF1–AF22**.
