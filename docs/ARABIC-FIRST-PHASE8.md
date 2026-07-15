# Arabic-first Phase 8 — Voice report context + lang hydrate

**Status:** Done  
**Date:** 2026-07-15  
**Track:** Arabic-first (AF8)

## Goals

1. Report voice sessions from the voice dock with channel id/name stamped into details  
2. Thin client lang hydrate: `LanguageProvider` initializes from cookie/storage (not always `en`)

## Done

| Item | Detail |
|------|--------|
| Voice report | `VoiceDock` Flag → `ReportDialog` with `voiceChannelId` / preview |
| Details stamp | `[voice:id\|name]` prefixed into report details |
| submitReport | Allows details-only reports (voice room context) |
| Lang init | `useState(() => resolveClientLang().lang)` on client |

## Deferred

- Dedicated `reports.voice_channel_id` column  
- Participant-picker for voice reports  
- Full SSR React tree bilingual (document still may EN on first HTML)  

## Arabic-first impact

| Area | Note |
|------|------|
| Moderation | Voice session context in report details for admins |
| Arabic UI | Less EN flash after hydrate when cookie is `ar` |
| Unresolved | Schema voice column; SSR HTML strings |
