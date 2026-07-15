# Arabic-first Phase 9 — Admin confirm dialogs i18n

**Status:** Done  
**Date:** 2026-07-15  
**Track:** Arabic-first (AF9)

## Goals

Localize remaining `window.confirm(...)` delete prompts in the admin console.

## Done

| Item | Detail |
|------|--------|
| Keys | `admin.confirm.deleteHub` / `deleteGame` / `deleteText` / `deleteVoice` |
| Wired | Hub, game, text channel, voice channel delete confirms in `admin.tsx` |

## Deferred

- Browser native confirm chrome (OS language) — copy only  
- Non-delete admin prompts if any remain  

## Arabic-first impact

| Area | Note |
|------|------|
| Arabic UI | Destructive confirms follow UI language |
| Moderation | Safer for Arabic-first admins |
| Unresolved | OS dialog chrome not localizable |
