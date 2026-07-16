# Nexus motion language (Phase G)

**Authority:** `design.md` Motion · `docs/UI-IMPLEMENTATION-PLAN.md` §11

## Principles
- Fast, natural, subtle, purposeful — iOS-like, not decorative.
- Respect `prefers-reduced-motion` and `.reduce-motion` on `<html>` (already global).

## Tokens (`src/styles.css`)

| Token | Default | Use |
|-------|---------|-----|
| `--nx-motion-ease` | `cubic-bezier(0.32, 0.72, 0, 1)` | Sheet / tab easing |
| `--nx-motion-fast` | `150ms` | Scrim fade, tab color |
| `--nx-motion-sheet` | `220ms` | Sheet enter |
| `--nx-motion-sheet-out` | `180ms` | Sheet exit |

Utilities: `nx-sheet-panel`, `nx-sheet-scrim`, `nx-tab-active`.

## Surfaces
- **App `Sheet`** (`app-shell`): slide + fade; title uses `nx-title`.
- **Radix `ui/sheet`**: Confirm / Filter / Report / message actions — duration via tokens.
- **Dock tabs**: `nx-tab-active` color transition (no bounce).

## Interaction rules
- Destructive confirms → `ConfirmSheet` (not `window.confirm`) in consumer flows.
- Report → bottom sheet (`ReportDialog` API, sheet presentation).
- No hover-only primary actions on touch/desktop consumer lists.
- Admin `/admin` may still use `confirm()` (out of A–H scope).
