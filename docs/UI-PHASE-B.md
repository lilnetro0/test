# Phase B — Design System

**Status:** Implemented — awaiting product sign-off before Phase C  
**Authority:** Frozen planning set + `docs/UI-DESIGN-SYSTEM.md`

---

## Delivered

1. **Tokens / type utilities** in `src/styles.css` (`nx-title`, `nx-label`, `nx-section`, `nx-body`, `nx-caption`, `nx-touch`, spacing vars). AR disables uppercase/tracking on `nx-*` + `.uppercase`.
2. **`src/components/ui-native/*`:** ScreenHeader, Section, ListRow, Field*, FilterSheet, ConfirmSheet, ListSkeleton, HeroSkeleton.
3. **Button audit:** `accent`, `quiet`, `touch` size; default maps to accent.
4. **EmptyState:** `primaryAction` / `secondaryAction`; uses `nx-title` / `nx-body`.
5. **Card policy:** Documented on `Card` + design-system doc (callouts only).
6. **Pilot:** Notifications uses `ScreenHeader` + `ListRow` + EmptyState CTAs (no full Discover/Home redesign).
7. **Dock:** Labels use `nx-label`.

---

## Testing checklist

- [x] AR UI titles/labels not uppercased via `nx-*` utilities  
- [x] `ListRow` / `Section` LTR-safe (logical props; pilot compiles)  
- [x] Touch targets ≥ 44px on `ListRow` / `touch` buttons  
- [x] EmptyState supports CTAs  
- [x] Skeleton presets exist  
- [x] No Home/Discover visual wipe  

Manual: EN + AR glance on Notifications + dock.

---

## Out of scope (later phases)

- Auth redesign (C)  
- Discover / Home (D)  
- Chat composer (E)  
- Wiring FilterSheet/ConfirmSheet into real flows (D/G)

---

## Approval

| Field | Value |
|-------|--------|
| Phase B product approval | **Approved** (continue → Phase C) |
| Approved by | Product |
| Date | 2026-07-16 |
