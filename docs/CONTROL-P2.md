# Nexus Control — P2 Implementation Report

**Date:** 2026-07-17  
**Phase:** P2 (Catalog)  
**Status:** Implemented (code)  
**SoT:** [`ADMIN-PANEL-BLUEPRINT.md`](./ADMIN-PANEL-BLUEPRINT.md) · [`ADMIN-PANEL-VISION.md`](./ADMIN-PANEL-VISION.md)  
**Depends on:** [`CONTROL-P0.md`](./CONTROL-P0.md) · [`CONTROL-P1.md`](./CONTROL-P1.md)

## Shipped

| Deliverable | Route / location |
|-------------|------------------|
| Communities list + create + delete | `/control/communities`, `/control/communities/new` |
| Community entity (overview / channels / voice / members / settings) | `/control/communities/$communityId/*` |
| MENA Arabic channel template (apply + seed on create) | Community channels tab · `/control/templates` |
| Games list + create + delete | `/control/games`, `/control/games/new` |
| Game entity (overview / artwork slots / linked communities) | `/control/games/$gameId/*` |
| Channels hub picker | `/control/channels` |
| Media library (upload + optional attach) | `/control/media` |
| Dashboard cards + ⌘K jumps for communities/games | Control shell / search dialog |
| Search → Control community / game entity | `/control/search` · ⌘K |
| Create community preselect `game_id` | `/control/communities/new?game_id=` |

## Design notes

- **Reuse legacy CRUD:** Control UI calls `src/lib/admin/api.ts` (hubs, games, channels, media). No duplicated mutation surface.
- **Read helpers** in `src/lib/control/api.ts`: `getControlHub`, `listControlHubMembers`, `getControlGame`.
- Legacy `/admin` remains bootstrap; banner copy updated to prefer Control for catalog too.
- Voice rooms under community are channel CRUD (P2); full voice ops are **P3 Realtime** (`/control/voice`).

## How to verify

1. Platform admin → `/control/communities` — create hub (optional MENA seed) → open entity tabs.
2. Channels: add/delete text; apply MENA template; voice room create/delete.
3. Members: change role / kick.
4. Settings: edit fields + upload community image.
5. `/control/games` — create game → artwork slots upload/clear → linked communities + “create community” (game preselected).
6. `/control/templates` and `/control/media` — apply template; upload and attach.
7. ⌘K / search — hub and game results open Control entity pages.

## Arabic-first impact

- All new Control P2 strings EN + AR (`control.comm.*`, `control.games.*`, `control.channels.*`, `control.templates.*`, `control.media.*`, nav/dash updates).
- MENA Arabic channel template remains the default seed/apply path for new hubs.
- Hub/game names and channel topics use existing consumer content (bidi via `dir` on shell).
- Logical CSS retained in Control lists/tabs.
- Unresolved: physical device RTL QA of community/game tabs; Media Library browse/list (upload-only v1).
  - Retiring `/admin` catalog tabs: done in post-P6 polish (`/admin` → `/control`).
