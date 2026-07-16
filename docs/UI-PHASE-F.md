# Phase F — Hub Experience

**Status:** Implemented — awaiting product sign-off before Phase G  
**Authority:** Frozen wireframes · Phase D/E chat kit · Phase B sheets

---

## Delivered

### Hub sheet
- Removed Discord-style dual-rail layout
- Horizontal hub switcher (reorder drag kept)
- **Text** channels as `ListRow`
- **Voice** rows with primary **Join** button (not whole-row ambiguity)
- Discover hubs link

### Progressive chrome
- **Search** opens a bottom sheet (results chip on main when query active)
- **Pins** use list rows in sheet
- Header actions remain progressive (search / pins / members)

### Members
- Bottom sheet (from D) retained
- **Kick** uses `ConfirmSheet` (no `window.confirm`)
- Softened presence copy (`nx-caption`)

### Empty channel
- Guided `EmptyState` with Channels + Discover CTAs

### Voice dock
- Sentence-case / `nx-caption` status line; mute/deafen/leave primary path unchanged

---

## Testing checklist

- [x] Hub sheet: switch hub, text channel, Join voice  
- [x] Search sheet + clear chip  
- [x] Kick confirm sheet  
- [x] Empty channel CTAs  
- [ ] Manual LiveKit join/leave on device  
- [ ] Manual AR hub names `dir=auto`  

---

## Approval

| Field | Value |
|-------|--------|
| Phase F product approval | **Approved** (continue → Phase G) |
| Approved by | Product |
| Date | 2026-07-16 |
