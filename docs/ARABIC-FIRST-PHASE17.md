# Arabic-first Phase 17 — Route/shell logical CSS

**Status:** Done  
**Date:** 2026-07-15  
**Track:** Arabic-first (AF17)

## Goals

Convert high-traffic product chrome from `ltr:`/`rtl:` physical pairs to logical CSS (`start`/`end`/`ms`/`me`).

## Done

| Surface | Change |
|---------|--------|
| `app-shell` Sheet | `start-0` / `end-0` + border-s/e |
| `bottom-dock` | Badge/menu `-end-*`, `md:end-3` |
| Home / DM / Friends | Online dots `end-0`, unread badge `-end` |
| Onboarding / What’s new | Close `end-3` |
| Root skip link | `focus:start-4` |
| `alert` / `navigation-menu` / `sidebar` bits | Logical padding/position |

## Deferred

- Sidebar layout still uses physical `data-side=left|right` (structural)  
- Switch thumb still uses `ltr:`/`rtl:` translate (Radix)  
- Calendar / carousel leftovers  

## Arabic-first impact

| Area | Note |
|------|------|
| RTL | Dock badges and sheets track reading direction without paired variants |
| Unresolved | Exhaustive ops/admin layout physics |
