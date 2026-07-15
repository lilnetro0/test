# Arabic-first Phase 18 — Self-hosted Noto Sans Arabic

**Status:** Done  
**Date:** 2026-07-15  
**Track:** Arabic-first (AF18)

## Goals

Serve Arabic text from self-hosted `@fontsource/noto-sans-arabic` (no Google CDN dependency for Arabic glyphs). Keep Latin Inter / Space Grotesk on Google for now.

## Done

| Item | Detail |
|------|--------|
| Dependency | `@fontsource/noto-sans-arabic` |
| CSS | Import `arabic-400` + `arabic-600` subsets in `styles.css` |
| Root head | Google Fonts URL drops Noto Sans Arabic |
| CSP | Removed unused `fonts.googleapis.com` from `connect-src` |

## Deferred

- Self-host Inter / Space Grotesk  
- Full Arabic font subset tooling / variable font  
- Optional `unicode-range` audits in CI  

## Arabic-first impact

| Area | Note |
|------|------|
| Perf / MENA | Arabic font loads from same origin (CDN-independent) |
| Typography | Stack unchanged: Inter/Space + Noto Sans Arabic fallback |
| Unresolved | Latin still Google CDN |
