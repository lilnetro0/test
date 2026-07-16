# Nexus UI Design System (Phase B)

**Authority:** `design.md` · Blueprint: `docs/UI-IMPLEMENTATION-PLAN.md` §6  
**Status:** Implemented — see `docs/UI-PHASE-B.md`

## Card policy

Cards are **callouts only**. Prefer spacing + typography + `Section` / `ListRow`. Do not wrap every list or settings block in `Card`.

## Type utilities (`src/styles.css`)

| Class | Use |
|-------|-----|
| `nx-title` | Screen / sheet titles (no uppercase) |
| `nx-section` | Section labels (EN may use small caps; AR forced sentence case via `html[lang=ar]`) |
| `nx-label` | Row titles, dock labels, field labels |
| `nx-body` | Supporting copy |
| `nx-caption` | Meta / timestamps |
| `nx-touch` | Min 44×44 touch target |

Spacing tokens: `--nx-space-1` … `--nx-space-6`, `--nx-touch`.

## Primitives (`src/components/ui-native`)

| Export | Role |
|--------|------|
| `ScreenHeader` | Title + trailing actions |
| `Section` | Group with optional label |
| `ListRow` | ≥44px interactive row |
| `Field` / `FieldInput` / `FieldTextarea` | Lightweight forms |
| `FilterSheet` | Bottom filter shell (wire in D+) |
| `ConfirmSheet` | Confirm / destructive shell |
| `ListSkeleton` / `HeroSkeleton` | Loading presets |

Import: `import { ScreenHeader, ListRow } from "@/components/ui-native"`.

## Buttons (`src/components/ui/button.tsx`)

Preferred variants: `accent` (primary CTA), `secondary` / `quiet`, `ghost`, `destructive`.  
Preferred size for primary mobile actions: `touch` (`min-h-11`).

## Empty states

`EmptyState` supports `primaryAction` + `secondaryAction` (legacy `action` still works).

## Migration guide (later phases)

1. Replace `h1 … uppercase tracking-*` with `ScreenHeader` / `nx-title`.  
2. Replace bordered card stacks with `ListRow` (+ optional `Section`).  
3. Auth/Settings inputs → `Field*` in Phases C / G.  
4. Discover filters → `FilterSheet` in Phase D.  
5. `window.confirm` / danger dialogs → `ConfirmSheet` when touching those flows.  
6. Keep Discover / Home / Chat visuals for their phases — do not restyle wholesale with these primitives yet beyond approved pilots.
