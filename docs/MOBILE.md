# Mobile navigation — Nexus

**Phase:** 14 (+ follow-up)  
**Date:** 2026-07-15

## What shipped

| Piece | Role |
|-------|------|
| `--dock-base-height` / `--dock-clearance` | Dock height + floating panel offset (+ keyboard inset) |
| App `Sheet` | Fixed overlay (covers dock); sits on `--dock-clearance`; Tab focus trap |
| Bottom dock | CSS var height; brand lift at `md`; class `bottom-dock` for keyboard hide |
| YouMenu | Hints hidden under `md`; body scroll lock + focus trap |
| `useIsMobile` / `isPhoneLikeUi` | Shared 768 breakpoint; assume phone until measured |
| `useKeyboardInset` | `--keyboard-inset` + `data-keyboard-open` (web visualViewport / Cap Keyboard) |
| Density | Tighter lists/composer/DM chrome/VoiceDock; settings/friends bottom pad |

## Chrome stack (phone)

```
#main-content
  header / lists / messages
  VoiceDock (optional, compact <768)
  Composer
BottomDock (hidden while keyboard open)
```

Sheets / YouMenu: `fixed inset-0 z-40` above dock.

## Keyboard behavior

1. Soft keyboard opens → `data-keyboard-open` → dock hidden, clearance collapses  
2. Cap uses `KeyboardResize.Body` + plugin show/hide (no double layout pad)  
3. Web uses `visualViewport` delta into `--keyboard-inset`  

## How to verify

1. Open hubs sheet — backdrop covers dock; Esc / Tab stay in overlay  
2. Focus composer on phone (Safari / Chrome / Cap) — dock hides; composer stays above keyboard  
3. DM: select a thread — title/search collapse; chips remain  
4. Settings last row tappable above home-indicator  
5. EN + AR dock badges / YouMenu / sheets  

### Cap keyboard smoke (manual — not CI)

- [ ] iOS Cap: hub composer focus — dock gone, send button reachable  
- [ ] iOS Cap: dismiss keyboard — dock returns  
- [ ] DM thread same as hub  
- [ ] Orientation change mid-compose does not leave blank strip  

## Still deferred

- Capacitor bundled SSR client (impossible as webDir-only — see `docs/CAPACITOR.md`)  
- Desktop rail replacing dock on large screens  
- Discord-scale IA  
- Automated Cap keyboard / visual CI  
- Full visual redesign  

Cap packaging / dual-mode: **`docs/CAPACITOR.md`** (Phase 15).
