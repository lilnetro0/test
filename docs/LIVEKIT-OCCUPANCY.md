# LiveKit occupancy — request model

Game Home polls hub voice occupancy via `listVoiceRoomOccupancy`.

## Current strategy

1. Load hub `voice_channels` (incl. `capacity` when migrated).
2. Short in-memory cache (8s) per hub.
3. `RoomServiceClient.listRooms(hubRoomNames)` — one call for activity hints.
4. `listParticipants(room)` **only** for rooms with `numParticipants > 0` (or for all rooms if `listRooms` fails).

Client polling pauses when:

- Document is hidden (`visibilitychange`)
- Game Home unmounts
- User is not a member (visitors do not poll)

## Why not fully batched

LiveKit’s server SDK has **no** batch “list participants for many rooms” API and no filter that returns identities for a room-name prefix in one response. Counts can come from `listRooms`; names/mute still need per-room `listParticipants`.

## Ops note

Prefer keeping voice channel counts modest per hub. Cache + pause-on-hidden are the primary traffic controls; further reduction would require LiveKit-side webhooks or a custom occupancy service.
