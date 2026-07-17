# Nexus Control — P4 Implementation Report

**Date:** 2026-07-17  
**Phase:** P4 (Insights)  
**Status:** Implemented (code)  
**SoT:** [`ADMIN-PANEL-BLUEPRINT.md`](./ADMIN-PANEL-BLUEPRINT.md) · [`ADMIN-PANEL-VISION.md`](./ADMIN-PANEL-VISION.md)  
**Depends on:** [`CONTROL-P0.md`](./CONTROL-P0.md) … [`CONTROL-P3.md`](./CONTROL-P3.md)

## Shipped

| Deliverable | Route / location |
|-------------|------------------|
| Dashboard KPI strip + attention items | `/control` |
| Analytics overview (7d / 30d) | `/control/analytics` |
| Engagement compare table | `/control/analytics/engagement` |
| Voice analytics snapshot | `/control/analytics/voice` |
| Community health leaderboard | `/control/community-health` |
| Permission stub | `analytics.read` |
| Nav + ⌘K jumps | Control shell / search dialog |

## Design notes

- **Interim OLTP aggregates** — Vision prefers a metrics warehouse; P4 v1 uses bounded `count` / `head` queries and documents the limit in UI copy.
- **DAU approx** = profiles with `last_seen_at` in last 24h (not banned).
- **Attention strip** drills to moderation / appeals / LiveKit health.
- **Community health score** = heuristic (members + voice rooms); not toxicity ML.
- Growth campaigns remain deferred (P6 Governance / GTM).

## How to verify

1. Platform admin → `/control` — KPI strip loads; attention cards link correctly.
2. `/control/analytics` — toggle 7d/30d; KPI tiles drill to queues/entities.
3. Engagement + Voice tabs show coherent numbers.
4. `/control/community-health` — low-score hubs first; open community / voice.

## Arabic-first impact

- All new Control P4 strings EN + AR.
- Region codes remain Latin/short codes (product data).
- Logical CSS retained in tables/lists.
- Unresolved: warehouse pipelines; retention D1/D7/D30; voice minutes; toxicity scores; RTL device QA of KPI strip.
