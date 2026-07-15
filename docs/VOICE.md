# Voice / LiveKit — Nexus

**Phase:** 12 (+ follow-up)  
**Date:** 2026-07-15

## What shipped

| Piece | Role |
|-------|------|
| `createVoiceToken` | Server mint after auth + hub membership / DM participant + ban check |
| Token TTL | `1h`; reconnect remints a fresh token |
| Mint rate limit | `claim_voice_token_mint` — 12 / user / 60s in Postgres (cross-worker); in-process fallback if RPC missing |
| `livekit-client` | Live join when `LIVEKIT_*` set; else stub |
| Reconnect | LiveKit `Reconnecting`/`Reconnected` + app remint after `Disconnected` (max 3) |
| Mute/deafen | Preferred mute + deafen preserved across reconnect |
| `VoiceDock` | Reconnecting UI; clears parent channel when session ends |
| `getVoiceHealth` | Settings → Voice + Admin header (Live vs Stub + host) |
| Cap audio | iOS `AVAudioSession` playAndRecord/voiceChat + `UIBackgroundModes: audio`; Screen Wake Lock while in voice |

## Env (server)

```bash
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
```

Never put LiveKit secrets in `VITE_*`.

## Room naming

| Surface | Room |
|---------|------|
| Hub voice channel | `voice_channels.livekit_room_name` or `nexus-{channelId}` |
| DM voice | `nexus-dm-{threadId}` |

## Client flow

1. User joins → `joinVoiceChannel` → mint → `Room.connect`
2. Transient drop → LiveKit reconnect events update dock
3. Hard disconnect → remint + reconnect (bounded)
4. Hang up → intentional leave; no remint; dock `onDisconnect`

## Migrations

- `20260715221000_phase12_followup_voice_mint_limit.sql`

## Ops checklist (outside repo)

- [ ] LiveKit Cloud (or self-hosted SFU) project for prod  
- [ ] Secrets in deploy env only  
- [ ] Confirm TURN/ICE quality for target regions  
- [ ] Scale / room limits on LiveKit dashboard  
- [ ] Health `livekit.reachable` true on `GET /api/health` (HTTPS `/` probe)

## Still deferred

- VoIP push / CallKit incoming-call UX  
- Full SFU ops / room admin dashboard + TURN/ICE synthetics  
- Discord-scale voice features (stages, watch party, etc.)

APNs **alert** push for Cap tokens is available when `APNS_*` env is set (`docs/PUSH.md`) — that is not CallKit.
