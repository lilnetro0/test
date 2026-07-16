# Community Game Home — Information Architecture

**Status:** Implemented  
**Companion:** `docs/CURRENT-COMMUNITY-CHAT-FLOW.md` (legacy sheet-first behavior)

## Hierarchy

```
My Communities (/)
  → Game Home (/c/$hubSlug)
      → Text chat (/c/$hubSlug/t/$channelSlug)
      → Voice rooms (join in place + global VoiceBar)
```

- **Home dock** → My Communities (joined hubs).
- **Discover / deep links / `?hub=`** → Game Home for that slug.
- Chat is a pushed screen with back to Game Home — not the community itself.

## Metaphor

Each hub is a **game home** (place), not a Discord-style server sidebar. The first screen answers: where am I, who’s online, what’s live, which voice rooms are active, which text channels matter.

## Voice occupancy

`listVoiceRoomOccupancy` (LiveKit `RoomServiceClient`) fills voice room cards before Join. Soft `voice_channels.capacity` supports `n / max` UI. Apply `supabase/manual/10_voice_capacity.sql` (or the matching migration) on live projects.

## Global voice

`GlobalVoiceBar` in `AppShell` mirrors `getVoiceClient()` so mute/leave survive route changes.
