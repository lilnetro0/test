# Nexus — Public launch checklist

Complete Phases **0–18** hardening in-repo, then run this go/no-go before cutting production traffic or App Store submit.

Deep dives: [`docs/APP-STORE.md`](docs/APP-STORE.md) · [`docs/OPS.md`](docs/OPS.md) · [`docs/TESTING-SECURITY.md`](docs/TESTING-SECURITY.md) · [`docs/CAPACITOR.md`](docs/CAPACITOR.md) · [`docs/DATABASE-OPERATIONS.md`](docs/DATABASE-OPERATIONS.md)

## Infrastructure

- [ ] Supabase project: all migrations applied; `supabase/verify_schema.sql` has **no MISSING** rows
- [ ] Auth: email confirm enabled (or intentional auto-confirm for TestFlight beta)
- [ ] Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only)
- [ ] Env: `VITE_USE_MOCK` **unset** in production
- [ ] LiveKit (voice): `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` — or accept stub voice
- [ ] `SITE_URL` / production origin for sitemap, OG, OAuth redirects
- [ ] Optional ops: `OPS_ALERT_WEBHOOK_URL` / `OPS_PAGERDUTY_ROUTING_KEY`, `HEALTH_CHECK_URL`

## Legal & trust

- [ ] Review `/terms`, `/privacy`, `/cookies`, `/guidelines`
- [ ] Replace placeholder `legal@` / `privacy@` inboxes with real ones
- [ ] Age gate (13+) verified in QA
- [ ] ASC Privacy questionnaire matches `PrivacyInfo.xcprivacy` + [`docs/APP-STORE.md`](docs/APP-STORE.md)

## Moderation

- [ ] Report a message / DM → row in `reports`; admin can review
- [ ] Block / unblock on Friends
- [ ] Ban test: `profiles.banned_at = now()` → signed out on next load

## PWA & iOS packaging

- [ ] `npm run icons` → `/icons/icon-192.png` + `icon-512.png` (CI: `smoke:launch`)
- [ ] Production build registers `/sw.js` (skipped in `npm run dev`)
- [ ] Install / Add to Home Screen smoke on mobile web
- [ ] Cap remote shell: `CAPACITOR_SERVER_URL` HTTPS in Codemagic group `test`
- [ ] TestFlight IPA from `ios-capacitor` installs and loads live origin

## Security

- [ ] `npm run ci:verify` green (`test` + typechecks + `smoke:security` + `lint:ci`)
- [ ] `npm run smoke:launch` green
- [ ] RLS spot-check: messages/DMs/notifications scoped to members (two accounts)
- [ ] No service role in any `VITE_*` variable

## Monitoring

- [ ] `GET /api/health` → 200 on production ([`docs/OPS.md`](docs/OPS.md))
- [ ] `npm run ops:health` against prod URL
- [ ] Admin header shows DB + LiveKit chips
- [ ] 404 and root error UI render branded pages

## Product smoke (two accounts)

- [ ] Register → profile in DB
- [ ] Hub chat Realtime (send / edit / react / soft-delete)
- [ ] Friend request → accept → DM
- [ ] Notification badge
- [ ] Voice join (LiveKit or stub dock disclosed to testers)
- [ ] Account export JSON + delete confirmation path (staging only for delete)

## App Store Connect

- [ ] Store listing + Review Notes from `docs/store/` (replace YOUR_ORIGIN / reviewer account)
- [ ] Screenshots per `docs/store/screenshots/README.md`
- [ ] APNs keys on server if Cap push send required (`APNS_*` in `.env.example`)
- [ ] Privacy Policy + Support URLs live
- [ ] Age rating / export compliance confirmed

## When green

Ship web origin, then TestFlight → App Store. Remaining **product** deferrals (honest): Cap bundled SPA, Play/Android CI, APNs server send, CallKit, full APM SDKs, Playwright staging E2E — see phase docs.
