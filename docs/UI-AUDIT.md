# Nexus UI Audit vs Design Language

**Document:** `design.md` (Nexus Design Language v1.0) — single source of truth  
**Date:** 2026-07-16  
**Mode:** Audit complete — phased redesign **A–H implemented** (see phase docs).  
**Authority:** Every future frontend change must review `design.md` first, then this audit’s roadmap.

### Redesign status (2026-07-16)

| Phase | Doc | Status |
|-------|-----|--------|
| A Nav IA | `UI-PHASE-A.md` | Done |
| B Design system | `UI-PHASE-B.md` | Done |
| C Auth | `UI-PHASE-C.md` | Done |
| D Home/Discover | `UI-PHASE-D.md` | Done |
| E Chat/DM | `UI-PHASE-E.md` | Done |
| F Hub | `UI-PHASE-F.md` | Done |
| G Motion | `UI-PHASE-G.md` | Done |
| H Polish | `UI-PHASE-H.md` | Done |

Manual gates remaining: full RTL checklist, VoiceOver smoke, mid-range device QA (waived from code DoD; track in product QA).

---

## Executive verdict

Nexus already has strong foundations for a premium Arabic gaming app: dark OKLCH tokens, restrained cyan accent, bottom dock + safe areas, bottom sheets for hub switching, bilingual i18n/RTL bootstrap, and `dir="auto"` on much UGC.

It still **reads as a responsive Discord-inspired web app** more than a premium native iOS product. The gap is structural, not cosmetic:

1. **Information architecture** — logo-centric dock; Friends/Notifications buried; Settings is a desktop sidebar compressed into chips  
2. **Discord chrome** — Home channel rail, member side panel, hover toolbars, dense composer  
3. **Card / filter dashboards** — Discover as marketing hero + chip filters + card grid  
4. **Latin typography rules on Arabic** — widespread `uppercase` / `tracking-widest`  
5. **Web patterns** — centered glass auth card, split-pane DMs, `window.confirm`, dialogs over sheets  

**Do not redesign screen-by-screen.** Execute the phased roadmap at the end of this document after approval.

---

## Severity scale

| Level | Meaning |
|-------|---------|
| **P0 — Critical** | Breaks native feel or Arabic-first identity on every session |
| **P1 — High** | Primary surfaces feel like a website / Discord clone |
| **P2 — Medium** | Clear design.md violations; polish / consistency |
| **P3 — Low** | Local inconsistencies; fix inside larger phases |

---

## Overall visual consistency

| | |
|--|--|
| **Current** | Shared dark tokens and accent exist (`src/styles.css`), but screens mix patterns: glass auth card, Discord settings sidebar, marketing Discover hero, Discord hub chrome, card grids on Discover/Friends/Notifications. |
| **Violates** | Visual Identity; Components (“Less visual weight”); What Nexus Is NOT (Discord clone, responsive website, dashboard of cards). |
| **Website feel** | Each route looks like a different web template sharing a color palette. |
| **Recommended** | One mobile-first shell language: section headers + spacing, list rows, bottom sheets — applied product-wide via Phase B design system. |
| **Complexity** | High (systemic) · **Severity:** P0 |

---

## Navigation

| | |
|--|--|
| **Current** | `bottom-dock.tsx`: Home · Discover · **logo (opens hubs)** · Messages · You. Friends, Notifications, Settings live under You overlay. Logo uses glow + `md:-translate-y-2`. Labels often `uppercase tracking-wide`. |
| **Violates** | Navigation (“Branding should never reduce usability”; “Icons must communicate meaning”); Clarity over aesthetics. |
| **Website feel** | Floating brand FAB + overflow account menu = web/Discord mobile, not an iOS tab bar where every destination is obvious. |
| **Recommended** | Clear 4–5 destinations with readable icons/labels; hub switcher from Home header (or long-press Home), not the brand center control; sentence-case labels; demote glow. |
| **Complexity** | Medium · **Severity:** P0 |

---

## Information hierarchy

| | |
|--|--|
| **Current** | Many screens give equal weight to chrome and content (Discover filters = hero; Home header packs search/pins/members; Settings cards all look primary). |
| **Violates** | Visual Hierarchy (one primary focus); Simplicity (Where am I / What next?). |
| **Website feel** | Dashboard density — everything competes. |
| **Recommended** | One hero focus per screen; progressive disclosure for advanced actions (sheets / overflow). |
| **Complexity** | Medium–High · **Severity:** P1 |

---

## Mobile usability

| | |
|--|--|
| **Current** | Good: `h-dvh`, `pt-safe` / `pb-safe`, dock clearance, keyboard inset, hub switcher as bottom sheet. Weak: members as `side="right"` sheet; reports as centered Dialog; Discover chip wrap; Settings desktop-first; DM split-pane on `md:`. |
| **Violates** | Mobile First; Mobile Experience (thumb reach; bottom sheets over large modals). |
| **Website feel** | Side drawers, centered dialogs, `confirm()`, desktop breakpoints inventing second UIs. |
| **Recommended** | Bottom sheets for members / report / filters / confirmations; mobile list→push for DMs; Settings as stacked list→detail. |
| **Complexity** | Medium · **Severity:** P1 |

---

## Native iOS feel

| | |
|--|--|
| **Current** | Safe areas and sheets help; overall still web: glass cards, hover toolbars (`group-hover` message actions), logo glow, marketing heroes, Discord rails. |
| **Violates** | Native Experience; Decision Framework (“Would Apple ship this?”). |
| **Website feel** | Responsive SPA with Cap WebView shell, not UIKit-like structure. |
| **Recommended** | Full-bleed screens, navigation push, system-like sheets, no hover-primary interactions. |
| **Complexity** | High · **Severity:** P0 |

---

## Discover page

**File:** `src/routes/discover.tsx`

| | |
|--|--|
| **Current** | Eyebrow + huge uppercase H1 + gradient hero; search; region chips; 6 genre chips; trending cards; responsive 2–4 column hub card grid. Games/communities/people hierarchy absent. LFG empty is a muted line. |
| **Violates** | Discover Experience (“inspire, not advanced search”; reduce filters → sheets; games → communities → people); Cards; Typography (uppercase Arabic). |
| **Website feel** | Landing page + filter toolbar + marketplace grid. |
| **Recommended** | Editorial game strip first; communities under game; people third; one search + Filters sheet; list/editorial rows; rich empties with CTAs. |
| **Complexity** | High · **Severity:** P0 |

---

## Hub / Home experience

**Files:** `src/routes/index.tsx`, hub sheet in shell, `hub-hero.tsx`

| | |
|--|--|
| **Current** | Chat-first Discord pattern: hub sheet as server rail (# text + voice + reorder); dense header (search/pins/members); members right-side roster; loading = plain text. |
| **Violates** | What Nexus Is NOT (Discord clone); Simplicity; Mobile sheets preference. |
| **Website feel** | Discord web: servers + channels + member sidebar. |
| **Recommended** | Current hub identity clear at top; simple channel list; voice as primary join; members bottom sheet; skeletons + guided empty channel. |
| **Complexity** | High · **Severity:** P0 |

---

## Chat experience

**Files:** `src/components/composer.tsx`, `src/components/message-item.tsx`

| | |
|--|--|
| **Current** | Composer: Plus + Paperclip + Gift(soon) + @ + emoji + Send in bordered bar. Messages: large avatars, hover/always toolbars, dropdown menus. |
| **Violates** | Simplicity; Progressive disclosure; Premium = restraint; Native (iOS Messages ≠ Discord). |
| **Website feel** | Desktop chat web — `group-hover` action chrome. |
| **Recommended** | Single-line composer (text + attach + send); secondary actions in sheet; long-press menu on mobile; tighter spacing. |
| **Complexity** | Medium · **Severity:** P1 |

---

## DM experience

**File:** `src/routes/dm.tsx`

| | |
|--|--|
| **Current** | `md:` sidebar inbox + thread; mobile horizontal conversation chips; dead Video/Pin; hero “start conversation” with uppercase display name. |
| **Violates** | Mobile First; one primary focus; clarity (disabled chrome). |
| **Website feel** | Split-pane web messenger. |
| **Recommended** | List → full-screen thread with back; remove/soon-gate dead actions; quieter header. |
| **Complexity** | Medium · **Severity:** P1 |

---

## Login / Register

**Files:** `src/components/auth-shell.tsx`, `login.tsx`, `register.tsx`, forgot/reset

| | |
|--|--|
| **Current** | Decorative game-tile backdrop; giant glass `backdrop-blur` card; uppercase labels/titles/CTAs; every field labeled + placeholder; long register; three equal OAuth buttons. |
| **Violates** | Cards; Layout; Forms; Typography / Arabic First; Visual Hierarchy. |
| **Website feel** | SaaS marketing auth panel. |
| **Recommended** | Full-bleed quiet dark screen; placeholder-led fields; multi-step register; primary email CTA; lighter OAuth. |
| **Complexity** | Medium · **Severity:** P1 |

---

## Settings

**File:** `src/routes/settings.tsx`

| | |
|--|--|
| **Current** | Desktop `aside` sidebar + content; mobile sticky header + horizontal section chips; almost everything in `Card`; Keybinds as first-class; empty hubs hardcoded English. |
| **Violates** | Mobile First; Cards; What Nexus Is NOT (Discord/settings website); Empty States; Arabic First. |
| **Website feel** | Discord/desktop settings compressed to phone. |
| **Recommended** | iOS Settings pattern: section list → push detail; hairline grouped rows; bury Keybinds; i18n empties + CTAs. |
| **Complexity** | High · **Severity:** P0 |

---

## Profile

**Files:** `src/routes/me.tsx`, `src/routes/profile.$username.tsx`

| | |
|--|--|
| **Current** | Banner + overlapping avatar + bordered about card; 4 uppercase action chips; names forced `uppercase`; empty hubs / loading = inert text. |
| **Violates** | Native; Cards; Hierarchy; Typography / Arabic; Empty States. |
| **Website feel** | Twitter/Discord web profile. |
| **Recommended** | Compact identity header; primary Message; overflow for Report/Block; preserve name casing; alive empties. |
| **Complexity** | Medium · **Severity:** P1 |

---

## Bottom navigation

Covered under **Navigation**. Additional notes:

- Unread badges on Home/Messages are good (clarity).  
- You-menu overflow hides social destinations users expect on a tab bar.  
- Accent glow on logo conflicts with Color Philosophy (“minimal glow”).

---

## Typography

| | |
|--|--|
| **Current** | Space Grotesk + Inter + Noto Sans Arabic. Widespread `font-display … uppercase tracking-tight/widest` on titles, labels, CTAs, dock, Discover, Settings, auth — including Arabic strings. `html[lang=ar] .uppercase` override exists but is incomplete vs intentional `uppercase` classes. |
| **Violates** | Typography (“Never uppercase Arabic”; “Avoid excessive tracking”); Arabic First. |
| **Website feel** | Latin brand-mark styling forced onto all UI. |
| **Recommended** | Language-aware type scale; uppercase only for Latin brand tokens if needed; hierarchy via size/weight. |
| **Complexity** | Low–Medium · **Severity:** P0 |

---

## Spacing

| | |
|--|--|
| **Current** | Structure often via borders (`border-border-subtle`) on cards, chips, inputs, hub tiles rather than whitespace. |
| **Violates** | Layout (“Whitespace is a feature”; “Use spacing before borders”). |
| **Website feel** | Boxed web panels. |
| **Recommended** | Increase section spacing; reduce border reliance; hairlines only inside grouped lists. |
| **Complexity** | Medium · **Severity:** P1 |

---

## Cards

| | |
|--|--|
| **Current** | Auth glass card; Settings `Card` wrapper everywhere; Discover hub cards; Friends/Notifications bordered stacks; profile about card. |
| **Violates** | Cards (“only when they improve readability”; “Prefer sections”). |
| **Website feel** | Dashboard of cards. |
| **Recommended** | Default to sections/lists; cards only for destructive or marketing callouts. |
| **Complexity** | Medium · **Severity:** P1 |

---

## Forms

| | |
|--|--|
| **Current** | Pattern = tiny uppercase label + bordered input (+ placeholder). Register is long single page. Settings mixes Row+Toggle (better) inside cards. |
| **Violates** | Forms (lightweight, intelligent placeholders, group fields, reduce load). |
| **Website feel** | Dense HTML form. |
| **Recommended** | Placeholder-led; grouped; multi-step auth; iOS grouped form rows in Settings. |
| **Complexity** | Medium · **Severity:** P2 |

---

## Empty states

| | |
|--|--|
| **Current** | `EmptyState` component exists and is used on DMs/friends/notifications with some copy. Many surfaces still: plain gray text (profile loading/not-found, settings hubs empty EN-hardcoded, Discover LFG line, hub “Loading…”). Often no CTA. |
| **Violates** | Empty States (“Never empty black pages”; suggest next action + CTA). |
| **Website feel** | Placeholder paragraphs in panels. |
| **Recommended** | Shared empty language: illustration/icon optional, one sentence, one CTA (Discover / Friends / Join). |
| **Complexity** | Low–Medium · **Severity:** P1 |

---

## Loading states

| | |
|--|--|
| **Current** | Mostly text/`…`/disabled buttons; little skeleton language. |
| **Violates** | Premium Feel; Performance-as-design (perceived speed). |
| **Website feel** | Abrupt content pop-in. |
| **Recommended** | Lightweight skeletons matching final layout for hub, Discover, lists, profile. |
| **Complexity** | Medium · **Severity:** P2 |

---

## Animations

| | |
|--|--|
| **Current** | Sheet/`animate-in` slides; color transitions; press scale; reduced-motion prefs exist. No route push / tab spring language. |
| **Violates** | Mildly: Motion (“feel like iOS”). Not decorative overload (good). |
| **Website feel** | Tailwind enter classes ≠ UIKit navigation. |
| **Recommended** | Shared sheet/push/tab transitions; keep subtle; respect reduce-motion. |
| **Complexity** | Medium · **Severity:** P2 |

---

## RTL / Arabic experience

| | |
|--|--|
| **Current** | Strong: LanguageProvider, bootstrap RTL, Noto Arabic, auth lang toggle, prefs region, `dir="auto"` on messages/discover/composer (AF work). Weak: uppercase/tracking on AR UI; some EN-only empties; admin mostly EN; SSR flash EN. |
| **Violates** | Arabic First (“not mirrored”; review every screen in AR+EN); Typography. |
| **Website feel** | Translated Discord skin when uppercase Latin rules apply. |
| **Recommended** | Language-aware type; audit every empty/string; RTL review in each redesign phase. |
| **Complexity** | Medium (ongoing) · **Severity:** P0 |

---

## Accessibility

| | |
|--|--|
| **Current** | Skip link, some aria labels on dock/composer, focus trap on You menu, high-contrast + reduce-motion prefs. Gaps: icon-only controls without names in places; `confirm()`; Dynamic Type not systematically supported; VoiceOver path untested in CI. |
| **Violates** | Accessibility (Dynamic text, VoiceOver, focus, large targets — “never optional”). |
| **Website feel** | Web a11y bolted on, not designed. |
| **Recommended** | Touch ≥44pt; named controls; replace `confirm` with accessible sheets; Dynamic Type tokens; manual VoiceOver checklist per phase. |
| **Complexity** | Medium · **Severity:** P1 |

---

## Performance

| | |
|--|--|
| **Current** | Auth `backdrop-blur-xl`; dock blur; Discover/hub image heroes; large JS chunks historically; glow shadows in theme. Mid-range MENA devices matter per design.md. |
| **Violates** | Performance (“Avoid excessive blur”; mid-range responsiveness). |
| **Website feel** | Heavy web glassmorphism. |
| **Recommended** | Reduce blur layers; lazy media; avoid glow as default; measure on mid-tier phones. |
| **Complexity** | Medium · **Severity:** P2 |

---

## What already aligns (preserve)

- Dark theme + restrained cyan accent tokens  
- Bottom dock as primary nav surface + safe-area / keyboard clearance  
- Hub switcher as bottom sheet (directionally correct)  
- EmptyState component pattern (extend, don’t abandon)  
- EN/AR i18n + RTL bootstrap + UGC `dir="auto"`  
- Reduce-motion / high-contrast prefs  
- Logical CSS in high-traffic chrome (`ms`/`me`/`end`, etc.)

---

## Prioritized issue backlog

### P0 — Critical

1. Native feel / Discord-web identity across product  
2. Discover as filter + card marketplace  
3. Home as Discord hub chrome  
4. Settings desktop IA  
5. Navigation clarity (logo vs destinations)  
6. Arabic typography (`uppercase` / tracking)

### P1 — High

7. Chat composer + message hover chrome  
8. DM split-pane / chip inbox  
9. Auth glass card + decorative backdrop  
10. Profile banner web chrome  
11. Empty/loading language incomplete  
12. Mobile sheets vs side drawers / dialogs  
13. Accessibility gaps (confirm, Dynamic Type)

### P2 — Medium

14. Forms weight / register length  
15. Card diet residual  
16. Motion system (iOS-like push/sheet)  
17. Performance (blur/glow)  
18. Friends Discord social page (with nav promotion)

### P3 — Low

19. Keybinds demotion  
20. Dead “Soon” controls (Video, Call, GIF) clutter  
21. Admin EN ops surface (lower user impact)

---

# Redesign roadmap (systematic — not screen-by-screen)

**Rule:** Complete each phase’s design-system decisions before painting individual screens. Wait for explicit approval before implementation.

---

## Phase A — Navigation & Information Architecture

**Goals**  
Make “Where am I / What can I do / What’s next?” obvious on every primary surface. Fix dock destinations and bury branding as interaction.

**Affected screens**  
Bottom dock, You menu, Home hub entry, Friends, Notifications, Settings entry points.

**Expected UX improvements**  
Users reach Friends/Notifications without hunting; hub switching is intentional; logo no longer confuses as “primary button.”

**Implementation risks**  
Unread badge mapping; deep links/`?hubs=1`; muscle memory for center logo; Cap safe-area regressions.

---

## Phase B — Design System

**Goals**  
Codify spacing, type scale (EN/AR), list rows, section headers, sheet patterns, empty/loading skeletons, button hierarchy — matching `design.md`. Kill default card wrappers and Latin-uppercase-on-Arabic.

**Affected screens**  
All (foundation). Tokens in `styles.css`, shared UI primitives, EmptyState, form rows.

**Expected UX improvements**  
Visual consistency; Arabic type feels natural; less border noise; shared empty/loading language.

**Implementation risks**  
Large blast radius; temporary inconsistency if rolled halfway; must not break RTL.

---

## Phase C — Authentication Experience

**Goals**  
Full-bleed native auth; quiet background; lightweight forms; clear hierarchy for email vs OAuth; multi-step register if needed.

**Affected screens**  
Auth shell, login, register, forgot/reset password.

**Expected UX improvements**  
First open feels like a premium app, not a SaaS landing page.

**Implementation risks**  
OAuth button placement vs conversion; legal checkbox placement; keyboard + safe areas.

---

## Phase D — Home & Discover

**Goals**  
Discover inspires (games → community → people); filters in sheets; Home de-Discorded (simple channels, members sheet).

**Affected screens**  
Discover, Home/hub sheet, hub hero, LFG empty.

**Expected UX improvements**  
Discovery feels editorial and mobile; Home answers “my community + chat” without server-admin chrome.

**Implementation risks**  
Region/genre filter behavior (AF2); hub template channels still usable; admin hub management unchanged.

---

## Phase E — Chat & Messaging

**Goals**  
Simplify composer and message actions; DM list→thread push; remove dead controls.

**Affected screens**  
Composer, message item, channel view, DMs, notifications list presentation.

**Expected UX improvements**  
Chat feels like iOS Messages density, not Discord desktop; DMs feel native on phone.

**Implementation risks**  
Mention/attach/emoji flows; reaction UX; unread totals; realtime layout jumps.

---

## Phase F — Hub Experience

**Goals**  
Refine hub identity, voice join primacy, member roster as sheet, channel list simplicity, pins/search progressive disclosure.

**Affected screens**  
Home hub, voice dock entry points, members, pins/search UI.

**Expected UX improvements**  
Hub feels like a focused community space, not a Discord server clone.

**Implementation risks**  
Voice dock coupling; role/admin actions; drag-reorder hubs.

---

## Phase G — Motion & Interactions

**Goals**  
iOS-like sheet/push/tab motion; replace `confirm`/centered dialogs with sheets; long-press menus; no hover-only primary actions.

**Affected screens**  
Global navigation transitions, sheets, dialogs, message actions, reports.

**Expected UX improvements**  
Interactions feel physical and intentional; better thumb UX.

**Implementation risks**  
Reduced-motion; performance on mid-range; Radix/shadcn overrides.

---

## Phase H — Polish & Native Feel

**Goals**  
Empty/loading completeness; a11y (VoiceOver, Dynamic Type, targets); blur/glow diet; profile/settings residual polish; Arabic+EN QA pass per `RTL-TEST-CHECKLIST.md`.

**Affected screens**  
All remaining; profile; settings details; friends.

**Expected UX improvements**  
Product feels finished and shippable as premium MENA gaming app.

**Implementation risks**  
Scope creep; treat as freeze+fix, not new features.

**Status:** Done — see [`docs/UI-PHASE-H.md`](UI-PHASE-H.md) (2026-07-16). Manual RTL/VoiceOver/device QA remain product gates.

---

## Suggested execution order

```
A (IA/Nav) → B (Design system) → C (Auth) → D (Home/Discover)
  → E (Chat/DM) → F (Hub refine) → G (Motion) → H (Polish)
```

Phases **A** and **B** unlock everything else. Do not start Discover or Chat visuals before nav + type/spacing system exist.

---

## Explicit non-actions (this pass)

- No component redesigns  
- No token renames beyond documentation  
- No route IA code changes  

**Next step:** A–H redesign code complete. Run product QA (RTL checklist, VoiceOver smoke, mid-range device). New UI work should follow `design.md` + shared system — do not reopen Discord-style IA without a new approved plan.

---

## References

- [`design.md`](../design.md) — Design Language (authority)  
- [`docs/ARABIC-PRODUCT-GUIDELINES.md`](ARABIC-PRODUCT-GUIDELINES.md) — Arabic-first product  
- [`docs/RTL-TEST-CHECKLIST.md`](RTL-TEST-CHECKLIST.md) — RTL QA  
- [`docs/MOBILE.md`](MOBILE.md) — Cap / safe-area notes  
