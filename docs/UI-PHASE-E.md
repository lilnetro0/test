# Phase E — Chat & Messaging

**Status:** Implemented — awaiting product sign-off before Phase F  
**Authority:** Frozen plan §9 · Phase B sheets/primitives

---

## Delivered

### Composer
- Primary chrome: **+** (extras) · text · **Send**
- Extras sheet: attach, mention, emoji (GIF control removed from primary row)
- Mentions / LFG templates / reply / attach upload behavior preserved

### Message item
- Actions via **long-press / context menu / always-visible ⋯** (not hover-only)
- Bottom actions sheet: react, reply, pin, edit, report, delete
- Delete uses `ConfirmSheet`
- `dir="auto"` kept on author/body

### DMs
- **Mobile:** inbox list → full-screen thread with back (no chip strip IA)
- Dead **Video** / **Pin** header controls removed
- Voice call kept
- Desktop split inbox + thread retained
- `ScreenHeader` / `ListRow` / EmptyState CTAs

### Notifications
- Already on ListRow from Phase B — unchanged

### Home channel viewport
- Tighter message spacing (iOS-like density)

---

## Testing checklist

- [x] Composer primary = text + send; extras progressive  
- [x] Message actions without hover requirement  
- [x] Mobile DM list → thread + back  
- [x] Video/Pin removed from DM header  
- [ ] Manual: send/edit/delete/react/pin/report on device  
- [ ] Manual: attach + keyboard clearance  

---

## Approval

| Field | Value |
|-------|--------|
| Phase E product approval | **Approved** (continue → Phase F) |
| Approved by | Product |
| Date | 2026-07-16 |
