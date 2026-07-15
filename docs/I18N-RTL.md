# Arabic, RTL, and accessibility — Nexus

**Phase:** 13 (+ follow-up)  
**Date:** 2026-07-15

## What shipped

| Piece | Role |
|-------|------|
| EN/AR dict | Chat/voice/toast/error/a11y + `meta.title` / `meta.description` |
| `LanguageProvider` | Sets `html lang`/`dir`; persists `nexus.lang` + cookie |
| First-visit auto-detect | `navigator.language` → `ar` when no stored preference |
| Early bootstrap | Inline script: storage → cookie → browser → `dir=rtl` before paint |
| Runtime document meta | `document.title` + meta description follow language |
| Arabic font | Noto Sans Arabic stacked with Inter / Space Grotesk |
| AR typography | `html[lang=ar] .uppercase` disables forced uppercase |
| Chat chrome | `message-item` menus/aria via `t()`; logical `me-` margins |
| High-traffic `ui/*` | Sheet/dialog/alert/drawer logical close + text-start; dropdown `ps`/`pe`/`start` |
| Voice dock | Control labels + toasts localized |
| User toasts | Hub/DM/friends/discover/composer success & error copy |
| a11y | Skip link; close panel / primary nav / emoji / error page localized |
| Switch thumb | RTL-aware translate on Radix `Switch` |

## How to verify

1. Clear `nexus.lang` storage/cookie; set browser language to Arabic → first load uses AR + RTL  
2. Settings → Language → العربية  
3. Confirm dock, hubs sheet, composer, message actions, voice dock flip RTL  
4. Pin/edit/delete/react and check toast language  
5. Tab to skip link; reduce-motion still honored  
6. Change language → tab title + meta description update  

### Manual a11y smoke (no axe CI)

- [ ] Skip link reaches `#main-content`  
- [ ] Icon-only controls announce names (message bar, voice dock, dock nav)  
- [ ] Dialog/sheet close control is reachable and mirrored in RTL  
- [ ] Focus rings visible on interactive controls  
- [ ] Reduce motion + high contrast toggles apply  

## Still deferred

- Full `admin.tsx` i18n (ops surface; layout still follows `html dir`)  
- Exhaustive remirroring of rarely used `ui/*` (sidebar, menubar, etc.)  
- Crawler OG tags bilingual at request time (runtime title/description only)  
- Cookie-driven SSR React string hydrate (bootstrap + client hydrate; SSR HTML strings stay EN)  
- Automated axe / screen-reader CI suite  
