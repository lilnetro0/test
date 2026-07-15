# Arabic-first Phase 14 — High-traffic ui/* logical CSS

**Status:** Done  
**Date:** 2026-07-15  
**Track:** Arabic-first (AF14)

## Goals

Replace remaining physical margin/padding/alignment in high-traffic `ui/*` primitives so RTL does not trap padding or chevrons.

## Done

| File | Change |
|------|--------|
| `select.tsx` | `ps`/`pe`/`end` for item + indicator |
| `context-menu.tsx` | Logical inset / indicator / shortcut |
| `dropdown-menu.tsx` | `ms-auto` shortcut |
| `menubar.tsx` | Same pattern as context-menu |
| `pagination.tsx` | `ps`/`pe` + chevron `rtl:rotate-180` |
| `command.tsx` | `me-2` search icon, `ms-auto` shortcut |
| `table.tsx` | `text-start`, `pe-0` |
| `accordion.tsx` | `text-start` |
| `sheet.tsx` | `start`/`end` sides; `left`/`right` alias logical; default `end` |
| `sidebar.tsx` | `side="end"` |

## Deferred

- Exhaustive pass of all product routes (`sidebar` layout physics, charts)  
- Slide animation directions still use left/right tokens (positioning is logical)  

## Arabic-first impact

| Area | Note |
|------|------|
| RTL | Menus, selects, sheets open on logical edges |
| Unresolved | Non-ui product layout leftovers |
