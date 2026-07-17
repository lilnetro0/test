# Nexus Control — P0 Implementation Report

**Date:** 2026-07-17  
**Phase:** P0 (foundation)  
**Status:** Implemented (code)  
**SoT:** [`ADMIN-PANEL-BLUEPRINT.md`](./ADMIN-PANEL-BLUEPRINT.md) · [`ADMIN-PANEL-VISION.md`](./ADMIN-PANEL-VISION.md)

## Shipped

| Deliverable                          | Location                                                 |
| ------------------------------------ | -------------------------------------------------------- |
| Control shell (no consumer dock)     | `src/components/control/control-shell.tsx`               |
| Route tree `/control/*`              | `src/routes/control*.tsx`                                |
| Permission stubs                     | `src/lib/control/permissions.ts`                         |
| Auth gate (platform_admin)           | `src/hooks/use-control-access.ts` + `checkControlAccess` |
| Dashboard stub                       | `/control`                                               |
| Audit logs (list + detail, read)     | `/control/audit`, `/control/audit/$eventId`              |
| Global search (users / hubs / games) | `/control/search` + ⌘K in Control                        |
| Phase stubs for later IA             | `/control/phase/$code`                                   |
| Settings → Control                   | `settings.tsx`                                           |
| Consumer ⌘K → Control (admins)       | `command-palette.tsx`                                    |
| Legacy `/admin` banner               | `admin.tsx` (still works for catalog)                    |

## Hardening

- `/control` disables consumer-global hotkeys, onboarding, What's New, and the consumer command palette so Control owns ⌘K and does not stack player overlays.
- Control shell provides its own `#main-content` target for the global skip link.
- Control search clears stale loading state when the dialog closes or the query is shortened.

## Authz (P0)

- Still `requireAdmin` (`platform_roles.platform_admin` / `ADMIN_USER_IDS`).
- Client receives full `PLATFORM_ADMIN_PERMISSIONS` for nav filtering.
- Fine-grained Roles & Access = **P5**.

## Out of scope (intentional)

P1+ work queues, entity pages, flags/health UI, roles UI. Sidebar links deep-link to phase stubs.

## How to verify

1. Sign in as platform admin (real JWT — mock mode does not unlock Control).
2. Open `/control` — shell + dashboard, no bottom dock.
3. ⌘K — search users/hubs/games; jump to Audit.
4. `/control/audit` — list events; open a row for meta JSON.
5. Settings → Open Control; `/admin` shows legacy banner.

## Arabic-first impact

- All Control strings EN + AR in `i18n.tsx`.
- Shell uses logical CSS (`ms-auto`, `border-e`, `text-start`).
- Search uses `normalizeArabicForSearch` + `*_search_norm` columns.
- Document title: `meta.page.control`.
- Unresolved: physical RTL device QA of Control sidebar/topbar.
