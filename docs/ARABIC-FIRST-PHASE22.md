# Arabic-first Phase 22 — Remaining physical CSS mop-up

**Status:** Done  
**Date:** 2026-07-15  
**Track:** Arabic-first (AF22)

## Goals

Clear AF17 deferred physical CSS on high-traffic leftovers.

## Done

| File | Change |
|------|--------|
| `switch.tsx` | Checked translate without redundant `ltr:` |
| `calendar.tsx` | `ps`/`pe`, `rounded-s`/`rounded-e` |
| `carousel.tsx` | `-ms`/`ps`, prev/next `start`/`end` |
| `settings.tsx` | Custom toggle translate (dir-pair only where needed) |

## Intentionally kept

- Sidebar `data-side=left\|right` structural layout  
- Radix `data-[side=*]` collision APIs  
- Dialog `left-[50%]` viewport centering  

## Arabic-first impact

| Area | Note |
|------|------|
| RTL | Calendar ranges + carousel controls track logical edges |
