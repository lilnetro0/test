# Nexus — Public launch checklist

Complete Phases 0–5 wiring first (`VITE_USE_MOCK=0`, schema + seed + Phase 3–4 SQL). Then:

## Infrastructure

- [ ] Supabase project: migrations applied (`nexus_core` + phase 2–6 SQL files or CLI `db reset`)
- [ ] Auth: email confirm enabled (or intentional auto-confirm for beta)
- [ ] Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only)
- [ ] Env: `VITE_USE_MOCK=0`
- [ ] LiveKit (optional for voice): `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
- [ ] `SITE_URL` / production origin set for sitemap & OG (see `src/routes/sitemap[.]xml.ts`)

## Legal & trust

- [ ] Review copy on `/terms`, `/privacy`, `/cookies`
- [ ] Replace `legal@nexus.app` / `privacy@nexus.app` with real inboxes
- [ ] Register age gate (13+) verified in QA

## Moderation

- [ ] Run [`supabase/04_phase6_launch.sql`](supabase/04_phase6_launch.sql) (`reports` + `profiles.banned_at`)
- [ ] Report a message → row in `reports`
- [ ] Block / unblock on Friends
- [ ] Ban test: set `profiles.banned_at = now()` → user signed out on next load

## PWA

- [ ] Icons present at `/icons/icon-192.png` and `/icons/icon-512.png` (`npm run icons` if regenerating)
- [ ] Production build registers `/sw.js` (SW skipped in `npm run dev`)
- [ ] Install / Add to Home Screen smoke test on mobile

## Security

- [ ] CSRF middleware present in `src/start.ts`
- [ ] No service role in any `VITE_*` variable
- [ ] RLS spot-check: messages/DMs/notifications scoped to members
- [ ] Security headers applied via `src/server.ts`

## Monitoring

- [ ] Trigger a client error → Lovable / hosting logs capture it
- [ ] 404 and root error UI render branded pages

## Product smoke (two accounts)

- [ ] Register → profile in DB
- [ ] Hub chat Realtime
- [ ] Friend request → accept → DM
- [ ] Notification badge
- [ ] Voice join (LiveKit or stub dock)

## When green

Ship. Defer: avatar Storage, GIFs/attachments, rate-limit infra, admin console UI.
