# Rate limits — Nexus

**Phase:** 7 (+ follow-up)  
**Date:** 2026-07-15

## Principle

Live chat / friends / reports write **browser → PostgREST**. Limits are enforced with **BEFORE INSERT/UPDATE** triggers so they cannot be skipped by ignoring Nitro. `service_role` bypasses (admin / ops).

Auth signup/signin/reset hit **Supabase Auth** directly — use Dashboard platform rate limits; the app adds soft client cooldowns.

## Limits (DB)

| Surface | Window | Cap | Exception scope |
|---------|--------|-----|-----------------|
| Channel messages | 5 seconds | 5 | `rate_limited:channel_burst` |
| Channel messages | 60 seconds | 40 | `rate_limited:channel_minute` |
| DM messages | 5 seconds | 5 | `rate_limited:dm_burst` |
| DM messages | 60 seconds | 30 | `rate_limited:dm_minute` |
| Channel edits | 5 seconds | 3 | `rate_limited:edit_burst` |
| Channel edits | 60 seconds | 10 | `rate_limited:edit_minute` |
| Reactions (insert) | 5 seconds | 8 | `rate_limited:reaction_burst` |
| Reactions (insert) | 60 seconds | 40 | `rate_limited:reaction_minute` |
| Reports | 1 hour | 10 | `rate_limited:report_hour` |
| Reports (same target) | 1 day | 3 | `rate_limited:report_target_day` |
| Friend requests | 1 day | 20 | `rate_limited:friend_day` |
| Voice token mint | 60 seconds | 12 | `rate_limited:voice_mint_minute` (RPC `claim_voice_token_mint`) |

## Client UX cooldowns

| Action | Cooldown | Storage |
|--------|----------|---------|
| Login | 3s | `sessionStorage` |
| Register | 30s | `sessionStorage` |
| Forgot password | 60s | `sessionStorage` |

`src/lib/rate-limit.ts` → `withMappedDbError` / `mapRateLimitError` / `checkAuthCooldown`.

## Ops checklist (not automated in repo)

### Supabase Auth (Dashboard → Authentication → Rate Limits / Attack Protection)

Confirm on **each** project (dev / staging / prod):

- [ ] Email/password sign-in rate limit enabled  
- [ ] Sign-up rate limit enabled  
- [ ] Password recovery rate limit enabled  
- [ ] (Optional) CAPTCHA / bot protection for public auth  

App cooldowns reduce accidental spam; they do **not** replace Auth API limits.

### Cloudflare (when the app is on CF Workers / zone)

Optional edge rules if the zone fronts Nexus:

- [ ] Rate limit `POST`/`GET` to auth routes (`/login`, `/register`, `/forgot-password`) ~10–30 req/min/IP  
- [ ] Challenge or block spikes on anonymous API edges if exposed  
- [ ] Do **not** rate-limit Realtime websockets aggressively  

No wrangler rate-limit config ships in-repo; configure in Cloudflare Dashboard for the deploy zone.

## Migrations

- `20260715170000_phase7_rate_limits.sql`
- `20260715171000_phase7_followup_edit_reaction_limits.sql`
- `20260715221000_phase12_followup_voice_mint_limit.sql`

## Out of scope

- Redis / dedicated quota service  
- Moving chat writes onto TanStack server fns  
- Attachment MIME/size allowlists ✅ (Phase 8; malware scan still deferred)  
- Voice token mint ✅ shared via Postgres (Phase 12 follow-up); Redis not required
