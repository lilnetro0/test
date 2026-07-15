# Arabic-first product guidelines — Nexus

**Audience:** Arabic-speaking gamers in Saudi Arabia and the wider MENA region.  
**Rule:** Arabic is the **primary** product language. English is supported — it is not the design-first language.

This document governs product, UX, content, moderation, onboarding, discovery, and engineering. Treat it as standing policy for every future phase.

Related:

- [`ARABIC-TERMINOLOGY.md`](ARABIC-TERMINOLOGY.md) — approved UI terms  
- [`RTL-TEST-CHECKLIST.md`](RTL-TEST-CHECKLIST.md) — QA gate  
- [`MENA-MODERATION-GUIDE.md`](MENA-MODERATION-GUIDE.md) — trust & safety  
- [`I18N-RTL.md`](I18N-RTL.md) — what shipped technically (P13+)

---

## 1. Primary audience

- Arabic-speaking gamers; SA + wider MENA  
- Mobile-first; mixed Arabic + English gaming terms  
- Preference for local communities over generic global Discord invites  

English remains available with **equal or lower** priority than Arabic for new work.

## 2. Default language resolution

Unless a saved preference exists:

1. Saved user preference (`nexus.lang` / profile `user_prefs.lang`)  
2. Device / browser language (`navigator` → `ar*`)  
3. Region (fallback — **not implemented yet**; do not use IP alone when added)  
4. English as final fallback  

Requirements:

- Arabic available on first launch and auth screens  
- Language change any time — including before onboarding completes  
- Persist across sessions / synced profile when logged in  
- RTL when language is Arabic  

## 3. Arabic is not “translation later”

Every screen must be reviewed for RTL, Arabic string length, mixed Latin/Arabic, numbers & dates, icon direction, form alignment, truncation, mobile keyboard, and search.

Do **not** ship English-only UI and bolt AR strings at the end.

## 4. Mixed-direction (bidi) content

Users write e.g. `رانك Diamond`, `PS5 فقط`, `ID: Talal#1234`.

Use:

- CSS logical properties (`ps`/`pe`/`ms`/`me`/`start`/`end`)  
- `dir="auto"` (or unicode-bidi isolation) on UGC: message body, usernames, hub/game titles, IDs  
- Isolation so timestamps / mentions / buttons do not reorder incorrectly  

## 5. Typography

- Stack must include an Arabic font (**Noto Sans Arabic** is in-app; IBM Plex Sans Arabic is an approved alternative)  
- No Inter-only Arabic rendering  
- Readable line-height; no clipped diacritics; no `uppercase` / tracked Latin styles on Arabic UI labels (`html[lang=ar] .uppercase` override exists)

## 6. Navigation & layout

In Arabic/RTL:

- Mirror directional chrome; keep play / mic / brand / check / platform logos unmirrored  
- Prefer logical CSS; test dock labels and iOS back behavior  
- Avoid unlabeled icon-only nav when meaning is unclear  

## 7. Positioning

Nexus is **not** an Arabic Discord clone. Prefer:

- Discovering Arabic gaming communities  
- Players by game, platform, rank, country/region, play time  
- Curated hubs; Arabic-first moderation; regional events / LFG  

Decision test: *“How does this help an Arabic-speaking gamer find the right community?”*

## 8–13. Hubs, discovery, time, search, onboarding, profiles

See product bullets in the phase brief. **Incremental:** ship templates and filters over time — do not hardcode every channel name for every game.

Current gaps (audit): region prefs + Discover filters shipped (AF2); hub channel templates and LFG still open; search normalization Partial; profiles lack play-style fields. Full audit: [`ARABIC-FIRST-AUDIT.md`](ARABIC-FIRST-AUDIT.md).

## 14–15. Moderation & 13+ trust

Arabic abuse (incl. Arabizi, mixed EN/AR, national/sectarian) is **core**. Automated tools assist; humans decide irreversible actions. Conservative DMs/privacy defaults for minors when age is known. Guidelines and appeals must exist in Arabic.

## 16–17. Notifications & tone

Natural Modern Standard Arabic for core UI; common gaming loanwords where expected. Maintain glossary in `ARABIC-TERMINOLOGY.md`.

## 18–22. Admin, analytics, performance, a11y, testing

Admin must review Arabic + bidi context. Prefer mid-range device / mobile-network performance. Every major phase: AR+EN desktop/mobile, mixed messages, keyboards, long labels. See `RTL-TEST-CHECKLIST.md`.

## 23. Definition of done (Arabic)

A feature is **not** done if it only works in English, RTL is broken, Arabic is clipped, bidi breaks chrome, moderation cannot handle Arabic, search fails for common Arabic game names, or mobile Arabic was not tested.

## 24. Phase completion report

Every future phase summary **must** include **Arabic-first impact**:

- Arabic UI changes  
- RTL testing  
- Mixed-direction handling  
- Arabic search impact  
- Moderation impact  
- Unresolved Arabic-specific issues  

## Implementation posture

Do **not** start a large redesign. Audit → docs (this set) → incremental tested fixes → larger MENA features (discovery filters, hub templates, onboarding personalization) as separate scoped work.
