# Operations — Nexus

**Phase:** 16 (+ follow-up)  
**Date:** 2026-07-15

Single ops index. Domain runbooks stay in their docs; this page is the incident / health entry point.

## Health probe

```http
GET /api/health
```

| Status | Meaning |
|--------|---------|
| **200** | Supabase service-role probe ok (`games` head count) |
| **503** | Service role missing or DB probe failed |

Example payload (no secrets):

```json
{
  "ok": true,
  "env": "production",
  "ts": "2026-07-15T00:00:00.000Z",
  "supabase": { "ok": true, "configured": true, "games": 12 },
  "livekit": {
    "configured": true,
    "urlHost": "….livekit.cloud",
    "reachable": true,
    "probeMs": 42
  }
}
```

LiveKit `configured: false` / `reachable: false` is **informational** (stub voice / SFU host) — readiness still passes if Supabase is ok. Reachability = HTTPS GET `/` on the LiveKit host (200/406), not a TURN/ICE synthetic.

**Admin** header shows the same dual chip (DB + LiveKit). Server fn: `getAppHealth`.

### Post-deploy / CI

```bash
# URL from HEALTH_CHECK_URL | CAPACITOR_SERVER_URL | SITE_URL
npm run ops:health
# or:
curl -fsS https://YOUR_ORIGIN/api/health
```

Codemagic `web-smoke` runs `ops:health` (skips if no URL env; set `OPS_HEALTH_REQUIRE=1` to fail-closed).

## Logging

- Helper: `src/lib/ops/log.ts` → JSON lines on stdout/stderr (`event`, `level`, `ts`, …)
- Host: Lovable / Cloudflare Workers / Codemagic logs — pipe these JSON lines into Datadog / Sentry Log Drain / OTel collector when you adopt APM
- Client error boundary: `reportLovableError` → `window.__lovableEvents` when the host injects it
- **Error fan-out:** `logEvent("error", …)` also calls optional Slack / PagerDuty (rate-limited 5 min / event title)

## Alerting (optional)

| Env | Role |
|-----|------|
| `OPS_ALERT_WEBHOOK_URL` | Slack Incoming Webhook (`{ text }`) |
| `OPS_PAGERDUTY_ROUTING_KEY` | PagerDuty Events API v2 trigger |

No-op when unset. Not a full on-call rotation product — wire schedules in Slack/PD themselves.

## Env fail-closed

See `.env.example` § D and `src/lib/supabase/env.ts`:

- Prod forbids `VITE_USE_MOCK`
- Requires `VITE_SUPABASE_*` and server `SUPABASE_SERVICE_ROLE_KEY`

## Domain runbooks (pointers)

| Topic | Doc |
|-------|-----|
| Schema apply / verify / reset gate | `docs/DATABASE-OPERATIONS.md` + `supabase/verify_schema.sql` |
| Auth / CF rate limits | `docs/RATE-LIMITS.md` |
| LiveKit / voice | `docs/VOICE.md` |
| Push dispatch webhook | `docs/PUSH.md` + `POST /api/push-dispatch` |
| Cap remote shell | `docs/CAPACITOR.md` |
| Admin break-glass | `docs/ADMIN-SECURITY.md` |

## Incident starters

| Symptom | First checks |
|---------|----------------|
| App 503 / blank | `GET /api/health` → Supabase keys / project status |
| Voice always stub | Health `livekit.configured` + `LIVEKIT_*` env on deploy |
| Voice configured but broken | Health `livekit.reachable` + LiveKit Cloud status |
| Push webhook 503 | `PUSH_DISPATCH_SECRET` set? VAPID keys? |
| Cap blank shell | `CAPACITOR_SERVER_URL` HTTPS + Codemagic group `test` |
| Schema drift | Run `verify_schema.sql` on that project |

## Still deferred

- Full Datadog / Sentry / OTel APM SDKs (use log drain + webhooks for now)  
- Managed on-call schedules / escalation policies (configure in Slack/PD)  
- LiveKit TURN/ICE synthetic + SFU room dashboard  
- Discord-scale ops dashboard  
