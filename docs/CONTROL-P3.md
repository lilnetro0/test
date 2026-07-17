# Nexus Control — P3 Implementation Report

**Date:** 2026-07-17  
**Phase:** P3 (Realtime)  
**Status:** Implemented (code)  
**SoT:** [`ADMIN-PANEL-BLUEPRINT.md`](./ADMIN-PANEL-BLUEPRINT.md) · [`ADMIN-PANEL-VISION.md`](./ADMIN-PANEL-VISION.md)  
**Depends on:** [`CONTROL-P0.md`](./CONTROL-P0.md) · [`CONTROL-P1.md`](./CONTROL-P1.md) · [`CONTROL-P2.md`](./CONTROL-P2.md)

## Shipped

| Deliverable | Route / location |
|-------------|------------------|
| Voice ops overview (counts + LiveKit chip) | `/control/voice` |
| Voice room list (search) | `/control/voice/rooms` |
| Voice room detail (capacity, live roster, force-disconnect, delete) | `/control/voice/rooms/$roomId` |
| Capacity policies board | `/control/voice/policies` |
| Live sessions map (active LiveKit rooms) | `/control/live` |
| LiveKit & SFU health (config + HTTPS probe) | `/control/livekit` |
| Nav + dashboard + ⌘K jumps | Control shell / search dialog |
| Phase stub copy aligned to vision | P3 Realtime · P4 Insights · P5 Platform · P6 Governance |

## Design notes

- **Vision SoT:** P3 is Realtime (not Content). Media library already shipped in P2; announcements/content remain P6.
- **APIs** in `src/lib/control/api.ts`: overview, room list/detail, capacity update, participant kick, live sessions, LiveKit health (via `collectAppHealth`).
- **Kick** uses LiveKit `RoomServiceClient.removeParticipant` + audit `voice.kick`.
- Live Sessions lists project-wide active rooms and joins to `voice_channels` by `livekit_room_name`.
- Per-user voice history on `/control/users/$userId/voice` still deferred (no session store); links to Voice Ops.

## How to verify

1. Platform admin → `/control/voice` — room/hub counts and LiveKit status.
2. Rooms → open a room → set capacity → refresh roster (needs LiveKit when live).
3. Force-disconnect a participant when someone is in-room.
4. `/control/voice/policies` — edit soft caps.
5. `/control/live` — active sessions when LiveKit has traffic; empty/stub otherwise.
6. `/control/livekit` — refresh probe latency / reachability.

## Arabic-first impact

- All new Control P3 strings EN + AR (`control.voice.*`, `control.live.*`, `control.livekit.*`, nav/dash/phase updates).
- Room and hub names remain consumer content (`dir` via shell).
- Logical CSS retained in lists/tabs.
- Unresolved: physical RTL QA of Voice Ops; multi-region SFU; TURN/ICE synthetics; durable per-user voice history.
