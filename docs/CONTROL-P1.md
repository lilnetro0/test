# Nexus Control — P1 Implementation Report

**Date:** 2026-07-17  
**Phase:** P1 (Trust & Safety)  
**Status:** Implemented (code)  
**SoT:** [`ADMIN-PANEL-BLUEPRINT.md`](./ADMIN-PANEL-BLUEPRINT.md) · [`ADMIN-PANEL-VISION.md`](./ADMIN-PANEL-VISION.md)  
**Depends on:** [`CONTROL-P0.md`](./CONTROL-P0.md)

## Shipped

| Deliverable | Route / location |
|-------------|------------------|
| Moderation queue (status filters, claim, Arabic assist) | `/control/moderation` |
| Report detail (templates, resolve/dismiss/ban) | `/control/moderation/$reportId` |
| Users directory (lookup + banned list) | `/control/users` |
| User overview (ban/unban) | `/control/users/$userId` |
| Memberships tab | `/control/users/$userId/memberships` |
| Reports + enforcement timeline tab | `/control/users/$userId/moderation` |
| Voice tab stub (URL IA for P4) | `/control/users/$userId/voice` |
| Internal notes (audit-backed `user.note`) | `/control/users/$userId/notes` |
| Basic appeals (banned-account queue) | `/control/appeals` |
| Enforcement history search | `/control/enforcement` |
| Permission stubs | `appeals.*`, `users.notes` |
| Nav + ⌘K + dashboard cards | Control shell / search dialog |

## Design notes

- **Appeals are basic:** no `appeals` table yet. Queue = currently banned profiles. Overturn → unban + `appeal.overturn`; Uphold → `appeal.uphold` audit only.
- **Enforcement events** are filtered audit actions (`user.ban`, `user.unban`, `report.set_status`, `appeal.*`, `user.note`, …).
- Legacy `/admin` Reports/Users tabs remain for bootstrap; Control is preferred for T&S.

## How to verify

1. Platform admin JWT → `/control/moderation` — filter open, claim, open detail.
2. Resolve/dismiss with Arabic template note; ban target when present.
3. `/control/users` — `Username#1234` lookup → overview → ban/unban.
4. User tabs: memberships, moderation timeline, notes.
5. `/control/appeals` — overturn or uphold a ban.
6. `/control/enforcement` — optional user UUID filter.

## Arabic-first impact

- All new Control P1 strings EN + AR.
- Report details and notes use `dir="auto"`.
- Arabic assist signals reused from `arabic-assist` (highlight only).
- Logical CSS retained in Control shell/tables.
- Unresolved: physical device RTL QA of queue + user tabs; dedicated appeals table (later).
