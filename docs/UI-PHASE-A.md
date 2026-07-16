# Phase A — Navigation & Information Architecture

**Status:** Implemented — awaiting product sign-off before Phase B  
**Authority:** Frozen `design.md`, `docs/UI-AUDIT.md`, `docs/UI-IMPLEMENTATION-PLAN.md`, `docs/NAVIGATION-SPEC.md`, `docs/UI-WIREFRAMES.md`  
**Scope:** Dock IA + hub entry only. No Discover/Settings/Chat visual redesign.

---

## Tab model (shipped)

Source order (RTL mirrors via CSS):

**Home · Discover · Messages · Friends · You**

| Tab | Destination | Badge |
|-----|-------------|-------|
| Home | `/` | Channel unread |
| Discover | `/discover` | — |
| Messages | `/dm` | DM unread |
| Friends | `/friends` | — (pending badge deferred; optional in NAVIGATION-SPEC) |
| You | Sheet → Profile, Notifications, Settings, Logout | Notification unread dot |

- Logo / center brand control **removed** from the dock.
- Friends **removed** from You sheet (primary path is the Friends tab).
- Hub switching is **not** a dock tab.

---

## Hub switching

| Entry | Behavior |
|-------|----------|
| Home header (hub name + chevron) | Opens Hub sheet |
| Deep link `/?hubs=1` | Opens Hub sheet once, then clears `hubs` from URL |
| Deep link `/?hub=<id>` | Existing select behavior unchanged |

Optional long-press Home → hubs: **not implemented** (NAVIGATION-SPEC Phase A+ / Later).

---

## Code touched

- `src/components/bottom-dock.tsx` — five-tab IA; sentence-case labels (no `uppercase`)
- `src/components/app-shell.tsx` — removed `onBrandClick` / `brandActive`
- `src/routes/index.tsx` — AppShell without brand props; hub button `aria-*`
- `src/lib/i18n.tsx` — `nav.home` → Home / الرئيسية; `nav.messages` → Messages / الرسائل

---

## Defaults applied from NAVIGATION-SPEC §15

| Decision | Choice |
|----------|--------|
| Tab model | Home · Discover · Messages · Friends · You |
| Long-press Home | Later (not in this phase) |
| You + unread | Always open You sheet |
| Android system back policy | Unchanged this phase (overlay/sheet Esc still works) |

---

## Testing checklist

- [x] Each primary destination reachable in one tap from dock (Friends included)
- [x] Hub sheet opens from Home header control
- [x] Hub sheet opens from `/?hubs=1`
- [x] Channel unread → Home; DM unread → Messages; notif badge on You
- [x] EN/AR dock labels updated; no `uppercase` on dock labels
- [x] Dock source order Home→…→You (RTL via layout, not reordered JSX)
- [ ] Manual Cap/iPhone safe-area smoke (device)
- [ ] Manual voice dock clearance above tab bar (device)

---

## Explicitly out of scope (Phase B+)

- Design tokens, type utilities, list/section primitives
- Discover / Settings / Chat visual redesign
- Android back → Home → exit policy wiring
- Friends pending-request dock badge

---

## Phase B gate

Do **not** start Phase B until this document is marked approved below.

| Field | Value |
|-------|--------|
| Phase A product approval | **Approved** (continue → Phase B) |
| Approved by | Product |
| Date | 2026-07-16 |
