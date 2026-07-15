# Arabic-first Phase 12 — Voice report participant picker

**Status:** Done  
**Date:** 2026-07-15  
**Track:** Arabic-first (AF12)

## Goals

When reporting a voice session, optionally pick which LiveKit participant is `target_user_id` (still allow channel-only reports via AF10 `voice_channel_id`).

## Done

| Item | Detail |
|------|--------|
| VoiceDock | `onReport(participants)` passes roster |
| ReportDialog | Optional select (excludes self); submits `targetUserId` |
| Home | Maps `identity` → picker ids |

## Deferred

- DM voice report wiring  
- Stub/mock roster enrichment  
- Admin display of picked display name (uuid still shown)  

## Arabic-first impact

| Area | Note |
|------|------|
| Moderation | Structured person + channel for MENA trust review |
| Unresolved | Empty roster in stub → channel-only fallback |
