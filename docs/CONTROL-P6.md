# Nexus Control — P6 Implementation Report

**Date:** 2026-07-17  
**Phase:** P6 (Governance)  
**Status:** Implemented (code)  
**SoT:** [`ADMIN-PANEL-BLUEPRINT.md`](./ADMIN-PANEL-BLUEPRINT.md) · [`ADMIN-PANEL-VISION.md`](./ADMIN-PANEL-VISION.md)  
**Depends on:** [`CONTROL-P0.md`](./CONTROL-P0.md) … [`CONTROL-P5.md`](./CONTROL-P5.md)

## Shipped

| Deliverable | Route / location |
|-------------|------------------|
| Inbox (cross-team attention) | `/control/inbox` |
| Tasks → Inbox alias | `/control/tasks` |
| Security center | `/control/security` |
| Announcements list + composer | `/control/announcements`, `/new` |
| Discovery & featured placements | `/control/discovery` |
| Growth home | `/control/growth` |
| Content hub | `/control/content` |
| Roles family matrix (suggested grants) | `/control/roles` |
| Governance migration | `supabase/migrations/20260717190000_control_governance.sql` |

## Design notes

- **Inbox** aggregates open/reviewing reports, banned appeals, LiveKit down, maintenance flag.
- **Announcements / Discovery** persist after governance migration; otherwise UI shows migration hint.
- **Roles matrix** documents suggested families; runtime still grants full `platform_admin` until fine-grained RBAC.
- **Growth** is a GTM pulse + shortcuts (not a full campaign system).
- Consumer delivery of published announcements / Discover placements shipped in the post-P6 polish (below).

## Post-P6 polish — consumer wiring

| Deliverable | Location |
|-------------|----------|
| Public notices server fn (no auth; published-only) | `src/lib/control/public.ts` → `getPublicPlatformNotices` |
| Global consumer strips (maintenance + announcement) | `src/components/platform-notices.tsx`, mounted in `AppShell` |
| Discover featured boost + badge | `src/routes/discover.tsx` |
| Consumer flag kill switches | `usePlatformFlags` → voice / LFG / regional / attachments |
| Legacy `/admin` retired | redirects to `/control` |

- `getPublicPlatformNotices` reads only: catalog flag states, up to 3 `published` announcements, and `active` discovery placements. Tables stay deny-all under RLS; the service-role server fn is the single public gate.
- The announcement strip shows the latest published announcement matching the UI language (`locale` = `both` or current lang) and is dismissible per announcement id (`localStorage`). The maintenance strip mirrors the amber demo/offline banners and is not dismissible.
- Discover sorts featured hubs/games first (stable sort — curated order via `position`) and marks featured hubs/games with a ★ chip. Placements target `hubs.id` / `games.id`, matched via `HubCard.hubUuid` / `catalogGameId`.
- Flag kill switches: `voice.enabled` blocks hub/DM joins; `lfg.enabled` hides Discover LFG filter + Game Home LFG chip; `discover.regional` hides region filters; `attachments.upload` hides composer attach.
- One fetch per session (module-level promise cache); mock mode skips the fetch entirely.
- `/admin` is a permanent redirect to `/control` (bookmarks preserved). Bootstrap nav link removed.

## How to verify

1. Apply `20260717190000_control_governance.sql`.
2. `/control/inbox` — items drill to moderation / appeals / LiveKit / flags.
3. Compose announcement (AR default) → list shows draft/published.
4. Feature a hub/game in Discovery; remove placement.
5. `/control/security` — posture chips + sensitive audit list.
6. `/control/roles` — family matrix + grant/revoke still works.
7. `/control/growth` + `/control/content` — shortcuts load.
8. Publish an announcement → consumer app shows the strip under the top banners; dismiss hides it and it stays hidden after reload.
9. Toggle `maintenance.banner` in `/control/flags` → amber maintenance strip appears on consumer screens (new sessions; cached per session).
10. Feature a hub in `/control/discovery` → it sorts first in Discover with a ★ badge.
11. Toggle `voice.enabled` / `lfg.enabled` / `discover.regional` / `attachments.upload` → consumer surfaces respect the kill switch (reload/new session).
12. Visit `/admin` → lands on `/control`.

## Arabic-first impact

- All new Control P6 strings EN + AR (incl. polish: `notice.maintenance`, `notice.dismiss`, `notice.flag.*`, `discover.featured`).
- Announcement composer defaults locale `ar`; title/body use `dir="auto"`. Consumer strip filters by UI language and renders announcement text with `dir="auto"`.
- Logical CSS retained (`ms-*`, `start/end`) in the new strips and badge.
- Unresolved: enforced RBAC per family; RTL device QA of inbox/security and the new consumer strips.

## Control roadmap status

| Phase | Status |
|-------|--------|
| P0 Foundation | Done |
| P1 Trust & Safety | Done |
| P2 Catalog | Done |
| P3 Realtime | Done |
| P4 Insights | Done |
| P5 Platform | Done |
| P6 Governance | Done |
