# Phase D — Home & Discover

**Status:** Implemented — awaiting product sign-off before Phase E  
**Authority:** Frozen wireframes + NAVIGATION-SPEC · Phase B primitives

---

## Delivered

### Discover
- Hierarchy: **Games → Communities → People** (no marketing hero + chip wall)
- Search field + **Filters** sheet (region, genre, LFG) via `FilterSheet`
- Communities as `ListRow` (not card grid)
- Game focus view (wireframe Game surface) with hubs for that game
- LFG empty uses `EmptyState` + clear-filters CTA
- Join → Home with hub slug preserved

### Home
- Hub header label uses `nx-label` (no uppercase display name)
- Live/demo badges de-emphasized
- Loading uses `ListSkeleton`
- Hub sheet section labels use `nx-section`
- **Members sheet is bottom** (not right drawer)

---

## Testing checklist

- [x] Discover hierarchy without opening filters  
- [x] Filters sheet applies region/genre/LFG  
- [x] Search + join navigation preserved  
- [x] LFG empty has CTA  
- [x] Members bottom sheet  
- [ ] Manual AR/EN visual pass on device  

---

## Out of scope (Phase E+)

- Chat composer / message actions  
- Deep hub identity polish (Phase F)  
- Settings redesign (Phase G)  

---

## Approval

| Field | Value |
|-------|--------|
| Phase D product approval | **Approved** (continue → Phase E) |
| Approved by | Product |
| Date | 2026-07-16 |
