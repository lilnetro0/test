# Phase H — Polish & Native Feel

**Status:** Implemented — A–H redesign series complete  
**Authority:** Frozen plan §12 · shared system from B–G

---

## Delivered

### Settings
- Mobile **list → detail** with `ScreenHeader` / `Section` / `ListRow` (back to section list)
- Desktop sidebar + detail retained
- Rows use `nx-*` / touch-friendly height; no bordered Card kit for chrome

### Profile (`/me`, `/profile/$username`)
- Compact sticky headers via `ScreenHeader`
- Display names **not** forced uppercase
- Edit/actions use `Button` + `Field*` primitives
- Loading → `ListSkeleton`; missing profile → `EmptyState`

### Friends
- `ScreenHeader` + sentence-case tabs (no Discord uppercase chrome)
- People lists as flat rows; search bar demoted; Call removed from row actions
- Add Friend uses accent `Button` + `nx-title`

### Blur / glow diet
- Dock: solid surface (no `backdrop-blur-xl`)
- Voice dock, Home header, You-menu scrim, legal header: blur removed or reduced
- Default `--shadow-glow-*` softened; high-contrast ring overrides kept

### Empties / a11y light pass
- Gray one-liners on profile/me hubs replaced with `nx-body` / EmptyState
- Touch targets on friends/profile actions via `nx-touch` / Button sizes

---

## Explicitly deferred / waived

- Full VoiceOver + Dynamic Type certification (manual product QA)
- Full `RTL-TEST-CHECKLIST.md` sign-off (manual)
- Admin `/admin` redesign (out of A–H scope)
- Mid-range device perf lab pass (blur diet done; device QA separate)

---

## Testing checklist

- [x] Settings list→detail on mobile layout  
- [x] Profile self + other (header/actions compile)  
- [x] Friends online/pending/blocked/add  
- [x] Blur/glow defaults reduced  
- [ ] Manual RTL-TEST-CHECKLIST complete  
- [ ] VoiceOver smoke: dock, compose, settings row  
- [ ] Mid-range device scroll OK  

---

## Approval

| Field | Value |
|-------|--------|
| Phase H product approval | **Approved** (continue = ship A–H) |
| Approved by | Product |
| Date | 2026-07-16 |
