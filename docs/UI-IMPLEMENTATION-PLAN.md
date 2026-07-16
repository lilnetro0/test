# Nexus UI Implementation Plan

**Status:** Blueprint only — **await approval before any code changes**  
**Authority:** [`design.md`](../design.md) · Findings: [`UI-AUDIT.md`](UI-AUDIT.md)  
**Date:** 2026-07-16  
**Rule:** Redesign the **shared system first**, then apply it to surfaces. Never redesign the same pattern page-by-page.

---

## 1. Purpose

Convert the approved UI audit into an executable blueprint so implementation:

- builds on a shared design system (no duplicated per-screen kits)
- follows phases **A → H** in order unless a phase explicitly allows parallel work
- preserves Arabic-first / RTL / Cap safe-area foundations already shipped
- can be reviewed phase-by-phase with clear definition of done

---

## 2. Non-negotiable implementation rules

1. Read `design.md` before each phase.  
2. Prefer **one shared primitive** over N local copies.  
3. Mobile-first layouts; desktop adapts — do not invent a second desktop IA.  
4. No new card wrappers, glow, or uppercase-on-Arabic unless `design.md` allows.  
5. Every phase ends with EN + AR visual pass (`RTL-TEST-CHECKLIST.md`).  
6. Stop after each phase for approval unless the user says “continue”.  
7. Admin (`/admin`) is **out of scope** for A–H unless a shared primitive change forces a compile fix.

---

## 3. Shared components — redesign once, reuse everywhere

These are the high-leverage building blocks. **Implement / stabilize in Phase B** (except dock IA in Phase A). Later phases consume them; they must not invent parallel variants.

| Shared asset | Proposed home | Replaces / consolidates | Used by |
|--------------|---------------|-------------------------|---------|
| **App tab bar** | `src/components/bottom-dock.tsx` | Logo-FAB nav + You overflow as primary IA | All authenticated shells |
| **App shell / page frame** | `src/components/app-shell.tsx` | Per-route ad-hoc headers | Home, Discover, DM, Friends, Notifs, Settings, Profile, Help |
| **Screen header** | `src/components/ui-native/screen-header.tsx` *(new)* | Scattered `h1 uppercase` headers | Most routes |
| **Section / group list** | `src/components/ui-native/section.tsx` + `list-row.tsx` *(new)* | Settings `Card` + Friends/Notifs bordered stacks | Settings, Friends, Notifications, Profile, Discover lists |
| **Primary / secondary / ghost button** | Extend `src/components/ui/button.tsx` + type utilities | Local `uppercase tracking-widest` CTAs | Auth, Discover, Chat, Profile |
| **Text field / form row** | `src/components/ui-native/field.tsx` *(new)* | `AuthField`, Settings inputs, Me edit labels | Auth, Settings, Profile edit, Report |
| **Filter sheet** | `src/components/ui-native/filter-sheet.tsx` *(new)* on `ui/sheet` | Discover chip walls; future list filters | Discover (D), Friends (H), Admin later |
| **Confirm sheet** | `src/components/ui-native/confirm-sheet.tsx` *(new)* | `window.confirm`, some Dialogs | Hub kick, deletes, Settings danger, Reports |
| **Empty state** | Extend `src/components/empty-state.tsx` | Gray one-liners | DM, Friends, Notifs, Discover LFG, Profile hubs, Settings hubs |
| **Skeleton** | Extend `src/components/ui/skeleton.tsx` + presets | “Loading…” text | Home, Discover, lists, Profile |
| **Composer** | `src/components/composer.tsx` | Per-surface chat bars | Home channel, DM |
| **Message row / actions** | `src/components/message-item.tsx` + action sheet | Hover toolbars | Home, DM |
| **Hub hero / media** | `src/components/hub-hero.tsx` | Discover cards + hub headers | Discover, Home |
| **LFG board** | `src/components/lfg-board.tsx` | Inline Discover LFG chrome | Discover |
| **Voice dock** | `src/components/voice-dock.tsx` | — (refine, don’t fork) | Home voice |
| **Report flow** | `src/components/report-dialog.tsx` → sheet | Centered Dialog | Chat, Profile, Voice |
| **Auth frame** | `src/components/auth-shell.tsx` | Glass card shell | Login, Register, Forgot, Reset |
| **Type / spacing tokens** | `src/styles.css` + `src/lib/ui-tokens.ts` *(optional)* | Ad-hoc `text-[10px] tracking-widest` | Global |
| **Language-aware text** | Utility e.g. `nx-title`, `nx-label` (no AR uppercase) | Raw `uppercase` classes | Global |

### Explicit “do not redesign per page”

| Anti-pattern | Instead |
|--------------|---------|
| New Settings-only `Card` | Use `Section` + `ListRow` |
| Discover-only filter chips row as permanent chrome | `FilterSheet` |
| Friends-only bordered list item | `ListRow` |
| Auth-only button styles | Shared `Button` variants |
| Per-route empty copy components | `EmptyState` API |
| Per-route loading strings | Skeleton presets |

---

## 4. Global dependency graph

```
Phase A (Nav IA)
    ↓
Phase B (Design system primitives + tokens)
    ↓
    ├─→ Phase C (Auth) ──────────────┐
    ├─→ Phase D (Home + Discover) ───┤  (C ∥ D allowed after B)
    └─→ Phase E (Chat + DM) ─────────┤
              ↓                      │
         Phase F (Hub refine) ←──────┘  (needs D Home shell + E composer)
              ↓
         Phase G (Motion / sheets / confirm)
              ↓
         Phase H (Polish / a11y / profile / friends residual)
```

**Parallelism:** After **B** ships, **C** and **D** may proceed in parallel. **E** may start after B; finish composer before F leans on it. **G** after E/F interaction surfaces exist. **H** last.

---

## 5. Phase A — Navigation & Information Architecture

### Objectives
- Make primary destinations obvious without a brand FAB.
- Promote Friends / Notifications out of an overflow-only path (or make You a clear hub with equal-weight destinations).
- Move hub switching to an intentional Home control (header / long-press), not center logo as primary nav.
- Preserve unread badges and safe-area dock behavior.

### UX goals
- User can answer “where do I go?” in under one second.
- Branding never blocks usability (`design.md` Navigation).
- Thumb-reachable tabs; sentence-case labels (EN + AR).

### UI components affected
- `src/components/bottom-dock.tsx` (primary)
- You overlay / menu inside dock
- Possibly `src/components/app-shell.tsx` (hub sheet trigger wiring)
- Home header control to open hubs sheet (`src/routes/index.tsx` — light touch only)

### Routes affected
- All routes using `AppShell` (behavior via dock)
- Deep links: `/?hubs=1`, Friends, Notifications, Settings, `/me`

### Shared components affected
- Bottom dock (canonical tab bar)
- App shell hub-sheet open API

### Estimated implementation order
1. Decide final tab set (recommended: Home · Discover · Messages · Friends · You **or** Home · Discover · Messages · You with Notifications on dock badge — **document choice in PR**).  
2. Rewire dock items + badges (channel / DM / notif).  
3. Relocate hub opener to Home (and keep `?hubs=1` working).  
4. Remove logo glow / `md:-translate-y-2` elevation.  
5. Update i18n labels (no uppercase classes).  
6. Cap/safe-area smoke.

### Dependencies
- None (first phase).  
- Must not wait on Phase B tokens (minimal class cleanup only).

### Potential regressions
- Users expecting center logo to open hubs  
- Unread badge wrong target  
- `?hubs=1` / onboarding flows  
- Focus trap on You menu  
- Keyboard inset + dock clearance

### Testing checklist
- [ ] Each primary destination reachable in one tap from dock  
- [ ] Hub sheet opens from Home control + `?hubs=1`  
- [ ] Channel unread → Home; DM unread → Messages; notif badge correct  
- [ ] AR + EN labels readable (no forced uppercase)  
- [ ] RTL dock order correct  
- [ ] iPhone safe-area: dock not clipped  
- [ ] Voice dock still clears above tab bar  

### Definition of done
- Dock IA matches approved tab model; logo is not the primary ambiguous control.  
- Hub switch entry point documented and working.  
- No Cap safe-area/unread regressions.  
- Phase A notes added under UI-AUDIT or a short `docs/UI-PHASE-A.md` summary.  
- **No** Discover/Settings visual redesign yet.

---

## 6. Phase B — Design System

### Objectives
- Codify type, spacing, section/list, buttons, fields, empty, skeleton, sheet patterns per `design.md`.  
- Eliminate Latin-uppercase-on-Arabic as a system default.  
- Provide primitives so C–H do not invent local kits.

### UX goals
- Consistent visual language across the app.  
- Arabic typography feels natural.  
- Spacing before borders; cards rare.

### UI components affected
- `src/styles.css` (tokens, utilities: `nx-title`, `nx-label`, spacing scale)
- `src/components/ui/button.tsx`, `input.tsx`, `textarea.tsx`, `sheet.tsx`, `skeleton.tsx`, `card.tsx` (card: discourage / document when allowed)
- **New:** `src/components/ui-native/*` (section, list-row, field, screen-header, filter-sheet, confirm-sheet)
- `src/components/empty-state.tsx` (API expansion: title, body, primary CTA, secondary CTA)

### Routes affected
- Indirectly all (primitives). Optional light adoption on 1–2 pilot screens (e.g. Notifications list) to prove reuse — **avoid full page redesigns**.

### Shared components affected
- All listed in §3 “Shared components” table (create or stabilize)

### Estimated implementation order
1. Token/type utilities (EN/AR; kill AR uppercase path).  
2. `ScreenHeader`, `Section`, `ListRow`.  
3. `Field` + button variant audit.  
4. `EmptyState` + skeleton presets (`ListSkeleton`, `HeroSkeleton`).  
5. `FilterSheet` + `ConfirmSheet` shells (behavior wired later in D/G).  
6. Document usage in `docs/UI-DESIGN-SYSTEM.md` (short) **or** section in this file.  
7. Pilot: migrate Notifications list chrome to `ListRow` only.

### Dependencies
- Phase A complete (nav stable so system isn’t fighting IA churn).

### Potential regressions
- Global CSS affecting admin/auth unexpectedly  
- RTL logical properties broken  
- High-contrast / reduce-motion prefs  
- Bundle size if new folder poorly tree-shaken  

### Testing checklist
- [ ] AR UI titles/labels not uppercased via utilities  
- [ ] `ListRow` / `Section` render correctly LTR + RTL  
- [ ] Touch targets ≥ 44px on list rows / buttons  
- [ ] EmptyState supports CTA  
- [ ] Skeleton presets match list/header layouts  
- [ ] Existing screens still compile; no unintended visual wipe of Home/Discover yet  

### Definition of done
- Documented primitive set exists and is used by at least one pilot surface.  
- Type utilities adopted in dock + pilot; migration guide listed for later phases.  
- Card usage policy stated (“callouts only”).  
- Ready for C/D/E to consume without new one-off kits.

---

## 7. Phase C — Authentication Experience

### Objectives
- Full-bleed native auth; remove giant glass card + decorative tile collage.  
- Lightweight forms; clearer email-vs-OAuth hierarchy; optional multi-step register.

### UX goals
- First launch feels premium and native (`design.md` Decision Framework).  
- Low cognitive load; clear next step.

### UI components affected
- `src/components/auth-shell.tsx`
- Shared `Field` / `Button` from B
- Possibly `src/components/legal-page.tsx` (link styling only)

### Routes affected
- `/login`, `/register`, `/forgot-password`, `/reset-password`

### Shared components affected
- Auth shell (frame)
- Field, Button, type utilities

### Estimated implementation order
1. Quiet full-bleed `AuthShell` (no glass card / tile wallpaper).  
2. Apply `Field` + button hierarchy (primary email CTA).  
3. Soften OAuth row (secondary weight).  
4. Register: group steps or progressive disclosure (account → identity → age/legal).  
5. Lang toggle preserved; safe-area preserved.  
6. EN/AR pass.

### Dependencies
- Phase B (`Field`, `Button`, type tokens).  
- Phase A not strictly required but preferred for product consistency.

### Potential regressions
- OAuth redirect UX  
- DOB / 13+ gate  
- Keyboard covering CTA on small phones  
- Cap status bar contrast on dark auth  

### Testing checklist
- [ ] Login/register/forgot/reset usable one-handed  
- [ ] No outer glass card; background quiet  
- [ ] AR + EN; lang toggle works  
- [ ] Email + password + OAuth still function  
- [ ] Age gate still blocks under-13  
- [ ] Safe areas OK on notched iPhone  

### Definition of done
- Auth matches native full-screen pattern using B primitives.  
- No decorative game-tile collage.  
- Forms pass Forms principles in `design.md`.

---

## 8. Phase D — Home & Discover

### Objectives
- Discover: inspire (games → communities → people); filters in sheet; reduce card grid.  
- Home: reduce Discord server chrome; clear hub identity; members as bottom sheet (structure); channels simplified.

### UX goals
- Discover feels editorial, not a search engine.  
- Home answers “my hub + what to do next” without admin density.

### UI components affected
- `src/routes/discover.tsx`, `src/components/hub-hero.tsx`, `src/components/lfg-board.tsx`
- `src/routes/index.tsx` (Home chrome / hub sheet presentation)
- `FilterSheet`, `Section`, `ListRow`, `EmptyState`, skeletons from B
- `app-shell` hub sheet content layout

### Routes affected
- `/discover`, `/` (Home)

### Shared components affected
- Hub hero, LFG board, EmptyState, FilterSheet, ScreenHeader, ListRow

### Estimated implementation order
1. Discover IA: game strip → communities → people/LFG.  
2. Collapse region/genre into Filters sheet; keep one search field.  
3. Replace card grid with editorial/list rows (hero media allowed sparingly).  
4. Home: simplify hub sheet list; header density reduction.  
5. Members panel → bottom sheet container (behavior polish in F/G).  
6. Empty/loading for Discover LFG + Home loading skeletons.  

### Dependencies
- Phase B primitives.  
- Phase A hub entry point.  
- Keep AF2 region filters / LFG data contracts working.

### Potential regressions
- Region/genre filter correctness  
- Join hub navigation  
- LFG post/jump flows (AF6–19)  
- Hub reorder / unread on Home  
- Performance with hero images  

### Testing checklist
- [ ] Discover hierarchy visible without opening filters  
- [ ] Filters sheet applies region/genre  
- [ ] Search + Arabic aliases still work  
- [ ] Join hub → Home with correct hub  
- [ ] LFG empty has CTA  
- [ ] Home hub sheet opens; switch hubs  
- [ ] AR/EN + RTL layout  
- [ ] No Discord-like permanent left rail on mobile  

### Definition of done
- Discover and Home use B primitives; no marketing-hero+chip-wall pattern.  
- Members presented as sheet (not right-side web drawer) on mobile.  
- Data features (region, LFG, join) unchanged in behavior.

---

## 9. Phase E — Chat & Messaging

### Objectives
- Simplify composer and message actions (long-press / sheet; no hover-primary).  
- DM: list → full-screen thread on mobile; remove dead Video/Pin chrome.  
- Notifications list presentation uses shared list rows (if not done in B pilot).

### UX goals
- Chat density like iOS Messages, not Discord desktop.  
- One-handed compose; secondary actions progressive.

### UI components affected
- `src/components/composer.tsx`
- `src/components/message-item.tsx`
- `src/components/emoji-picker.tsx` (entry point only)
- `src/routes/dm.tsx`
- `src/routes/notifications.tsx` (list chrome)
- `src/routes/index.tsx` (channel message viewport chrome only)

### Routes affected
- `/`, `/dm`, `/notifications`

### Shared components affected
- Composer, Message item, EmptyState, ConfirmSheet (delete), Report flow entry

### Estimated implementation order
1. Composer: text + attach + send primary; move @ / emoji / extras into sheet or overflow.  
2. Message actions: long-press / always-accessible menu; remove hover-only dependency.  
3. DM mobile: inbox list → push thread with back; kill chip strip as primary IA.  
4. Gate/remove dead Video/Pin.  
5. Notifications: full-bleed `ListRow` list + richer empty CTAs.  

### Dependencies
- Phase B.  
- Home channel canvas from D helpful but not blocking for composer/message-item.

### Potential regressions
- Mentions, attachments, reactions, pins, edit/delete  
- Unread marks / realtime scroll  
- Report from message  
- Keyboard + composer + dock clearance  

### Testing checklist
- [ ] Send/edit/delete/react/pin/report in channel  
- [ ] DM send + thread navigation on phone width  
- [ ] Attach image still works  
- [ ] Mentions still work  
- [ ] No hover-only essential action  
- [ ] Composer usable above keyboard  
- [ ] AR `dir=auto` preserved on body/author  

### Definition of done
- Composer/message-item are the single chat kit for channel + DM.  
- Mobile DM is list→thread.  
- Dead controls removed or clearly gated without visual clutter.

---

## 10. Phase F — Hub Experience

### Objectives
- Hub identity, voice join primacy, channel list simplicity, pins/search progressive disclosure.  
- Member roster + role actions refined on sheet pattern from D.  
- Align voice dock entry with simplified hub.

### UX goals
- Hub feels like a focused community, not a Discord server clone.

### UI components affected
- `src/routes/index.tsx` (remaining hub chrome)
- `src/components/voice-dock.tsx`
- Hub sheet internals in shell/index
- Pins/search UI surfaces on Home

### Routes affected
- `/` (primary), voice-related side effects

### Shared components affected
- Voice dock, Hub hero, ConfirmSheet (kick), ScreenHeader, Filter/search sheet if used for pins/search

### Estimated implementation order
1. Channel list visual simplification (text vs voice clarity without Discord rail aesthetic).  
2. Voice: one primary join path; dock remains global.  
3. Pins/search behind header actions → sheet.  
4. Members sheet: roster + admin actions with confirm sheet.  
5. Empty channel guided state.  

### Dependencies
- Phase D (Home structure).  
- Phase E (composer/message kit).  
- Phase B confirm/sheet primitives.

### Potential regressions
- LiveKit join/leave, mute/deafen  
- Hub roles / kick / permissions  
- Hub order drag-and-drop  
- Active count / presence  

### Testing checklist
- [ ] Join/leave voice; dock controls work  
- [ ] Switch text channels; unread clears  
- [ ] Pins/search accessible  
- [ ] Members sheet open/close; kick uses confirm sheet  
- [ ] AR/EN hub names `dir=auto`  
- [ ] Mid-tier device: no jank scrolling channel list  

### Definition of done
- Hub UX matches simplified IA; Discord sidebar metaphors gone on mobile.  
- Voice + members + channels verified.  
- No parallel hub UI kits introduced.

---

## 11. Phase G — Motion & Interactions

### Objectives
- Shared iOS-like sheet/push/tab motion; replace remaining `confirm`/centered dialogs with sheets.  
- Long-press menus standardized; no hover-only primary actions anywhere in consumer app.

### UX goals
- Interactions feel physical, fast, subtle (`design.md` Motion).

### UI components affected
- `src/components/ui/sheet.tsx`, `dialog.tsx`, `alert-dialog.tsx`
- `confirm-sheet`, message action menus
- `report-dialog.tsx` → sheet presentation
- Route transition helpers (if added under `src/lib/motion` or CSS)

### Routes affected
- Global; any route still using `confirm()` or Dialog for destructive UX

### Shared components affected
- Sheet, ConfirmSheet, Report flow, Dropdown/context menus used for messages

### Estimated implementation order
1. Inventory remaining `confirm(` and Dialog confirmations in `src/`.  
2. Migrate to `ConfirmSheet`.  
3. Report as sheet on mobile.  
4. Standardize sheet enter/exit + reduced-motion.  
5. Optional tab cross-fade (dock).  
6. Remove hover-only message actions if any remain.  

### Dependencies
- Phases E–F interaction surfaces exist.  
- Phase B ConfirmSheet/FilterSheet shells.

### Potential regressions
- Focus trap / scroll lock  
- Reduced-motion users  
- Android/Cap WebView animation performance  
- Radix dialog accessibility  

### Testing checklist
- [ ] Destructive actions use accessible confirm sheet  
- [ ] Report flow completable VoiceOver-friendly  
- [ ] `prefers-reduced-motion` / in-app reduce-motion respected  
- [ ] No essential hover-only controls on touch  
- [ ] Sheet dismiss + focus return  

### Definition of done
- Consumer app has no `window.confirm` for primary flows.  
- Motion language documented and applied to sheets/tabs.  
- Report uses sheet on small viewports.

---

## 12. Phase H — Polish & Native Feel

### Objectives
- Complete empty/loading coverage; a11y (targets, names, Dynamic Type where feasible); blur/glow diet; Profile + Settings + Friends residual to match system.  
- Full EN+AR QA against `RTL-TEST-CHECKLIST.md`.

### UX goals
- Product feels finished and natively premium on mid-range iPhone.

### UI components affected
- `src/routes/settings.tsx` (list→detail IA using Section/ListRow)
- `src/routes/me.tsx`, `profile.$username.tsx`
- `src/routes/friends.tsx`
- `auth-shell` / dock blur reduction
- `empty-state`, skeletons gaps

### Routes affected
- `/settings`, `/me`, `/profile/$username`, `/friends`, residual global

### Shared components affected
- Section, ListRow, EmptyState, ScreenHeader, Button, Field — final adoption pass

### Estimated implementation order
1. Settings: replace sidebar/chips+Card with section list → detail (mobile-first).  
2. Profile: compact header; overflow actions; no uppercase names.  
3. Friends: people-first lists via ListRow; demote Discord tabs chrome.  
4. Empty/skeleton sweep across remaining gray one-liners.  
5. Performance: reduce backdrop-blur/glow defaults.  
6. A11y pass + RTL checklist.  
7. Update `UI-AUDIT.md` status board to Done per phase.  

### Dependencies
- A–G complete (or explicitly deferred items listed).

### Potential regressions
- Settings prefs save (lang, region, push, hubs)  
- Profile edit / message / block / report  
- Friend request flows  
- Billing/keybinds “soon” sections  

### Testing checklist
- [ ] Settings all sections load/save  
- [ ] Profile self + other user  
- [ ] Friends online/pending/blocked  
- [ ] RTL-TEST-CHECKLIST complete  
- [ ] VoiceOver smoke: dock, compose, settings row  
- [ ] Mid-range device scroll/blur OK  
- [ ] No EN-only user-visible empties  

### Definition of done
- Audit P0/P1 consumer issues closed or explicitly waived in writing.  
- Shared system used consistently; no one-off card kits on Settings/Friends/Profile.  
- `UI-AUDIT.md` + this plan marked with completion dates.  
- Ready for App Store-facing visual QA.

**Completion:** Code DoD met 2026-07-16 — see `docs/UI-PHASE-H.md`. Manual RTL/VoiceOver/device gates tracked as product QA.

---

## 13. Cross-phase testing standards

Every phase must include:

| Gate | Requirement |
|------|-------------|
| **Build** | `npm run build` passes |
| **Unit** | Existing Vitest suite green; add tests only when logic moves (e.g. nav badge mapping) |
| **EN / AR** | Screenshot or manual pass both languages |
| **RTL** | Dock, headers, lists, sheets mirrored logically |
| **Mobile** | Width ~390 CSS px; thumb reach; safe areas |
| **Cap** | If dock/shell/safe-area touched: quick remote-shell smoke |
| **Arabic-first impact** | Note in phase completion summary |

---

## 14. Suggested PR / delivery slicing

| Slice | Content |
|-------|---------|
| PR-A | Dock IA + hub entry relocation |
| PR-B1 | Tokens + type utilities |
| PR-B2 | Section/ListRow/Field/Empty/Skeleton |
| PR-B3 | FilterSheet/ConfirmSheet shells + pilot |
| PR-C | Auth shell + forms |
| PR-D1 | Discover IA + filter sheet |
| PR-D2 | Home shell / members sheet |
| PR-E1 | Composer + message actions |
| PR-E2 | DM list→thread + notifications list |
| PR-F | Hub refine + voice entry polish |
| PR-G | Motion + confirm/report sheets |
| PR-H | Settings/Profile/Friends + a11y/perf |

Keep PRs mergeable and app green; avoid mega-PRs that mix B tokens with Discover redesign.

---

## 15. Out of scope (unless later approved)

- Admin console visual redesign  
- Marketing landing / store screenshots production  
- New product features (billing, GIF search, CallKit)  
- Replacing TanStack / Cap architecture  
- Discord feature parity for its own sake  

---

## 16. Approval gate

**No code changes until this blueprint is approved.**

Please confirm:

1. Tab model for Phase A (preferred option)  
2. Whether C ∥ D parallelism after B is allowed  
3. Approval to start **Phase A** (or **A+B**)

---

## References

- [`design.md`](../design.md)  
- [`docs/UI-AUDIT.md`](UI-AUDIT.md)  
- [`docs/RTL-TEST-CHECKLIST.md`](RTL-TEST-CHECKLIST.md)  
- [`docs/MOBILE.md`](MOBILE.md)  
- [`docs/ARABIC-PRODUCT-GUIDELINES.md`](ARABIC-PRODUCT-GUIDELINES.md)  
- [`AGENTS.md`](../AGENTS.md)  
