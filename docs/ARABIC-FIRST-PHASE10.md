# Arabic-first Phase 10 — Voice channel column on reports

**Status:** Done  
**Date:** 2026-07-15  
**Track:** Arabic-first (AF10)

## Goals

Promote AF8 voice-session stamp into a first-class `reports.voice_channel_id` column so moderation queues can see voice context without parsing details.

## Done

| Item | Detail |
|------|--------|
| Migration | `20260715260000_af10_report_voice_channel.sql` |
| Constraint | `reports_has_target` accepts `voice_channel_id` |
| RLS | Insert policy validates hub membership on that voice channel |
| Client | `submitReport({ voiceChannelId })` from home ReportDialog |
| Admin | List select + Reports row shows voice id chip |

## Ops

Apply migration on each Supabase env, then `verify_schema.sql` (expect `reports.voice_channel_id`).

## Deferred

- Participant picker for voice reports  
- Join voice channel name in admin list (uuid chip only for now)  
- Full LFG board / self-hosted fonts  

## Arabic-first impact

| Area | Note |
|------|------|
| Moderation | Structured voice context for MENA trust review |
| Unresolved | Name join / participant targeting |
