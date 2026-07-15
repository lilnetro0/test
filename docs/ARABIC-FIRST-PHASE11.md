# Arabic-first Phase 11 — In-hub LFG post helper

**Status:** Done  
**Date:** 2026-07-15  
**Track:** Arabic-first (AF11)

## Goals

Help Arabic-first users post looking-for-group messages when they are in an LFG text channel — templates only, no events board.

## Done

| Item | Detail |
|------|--------|
| Helper | `isLfgChannel()` in `src/lib/lfg.ts` (shared with AF7 jump/badge) |
| Composer | `lfgMode` shows EN/AR quick templates + LFG placeholder |
| Home | Passes `lfgMode={isLfgChannel(activeChannel)}` |

## Deferred

- Full LFG events / party board  
- Per-game template packs  

## Arabic-first impact

| Area | Note |
|------|------|
| Arabic UI | Templates authored AR-first in dictionary |
| Bidi | Template chips / input keep `dir="auto"` |
| Unresolved | Board-style discovery still deferred |
