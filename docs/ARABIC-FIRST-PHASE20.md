# Arabic-first Phase 20 — Self-hosted Latin fonts

**Status:** Done  
**Date:** 2026-07-15  
**Track:** Arabic-first (AF20)

## Goals

Drop Google Fonts CDN entirely; serve Inter + Space Grotesk from `@fontsource` like Noto Arabic (AF18).

## Done

| Item | Detail |
|------|--------|
| Packages | `@fontsource/inter`, `@fontsource/space-grotesk` |
| CSS | latin 400/600 Inter + 500/700 Space Grotesk imports |
| Root head | Removed Google stylesheet + preconnects |
| CSP | `style-src` / `font-src` are `'self'` (+ data for fonts) |

## Arabic-first impact

| Area | Note |
|------|------|
| Perf / MENA | All UI fonts same-origin; no Google dependency |
