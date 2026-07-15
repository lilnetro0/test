# Feature Readiness Matrix — Nexus

**Phase:** 18 (App Store / launch)  
**Date:** 2026-07-15  
**Legend:** Y = yes / implemented in repo · P = partial · N = no / not present · ? = cannot verify from repo alone (needs deployed env)

| Feature | UI | Backend | DB migration in repo | RLS in SQL | Realtime | Mobile / Cap | Automated tests | Production ready | Notes |
|---------|----|---------|----------------------|------------|----------|--------------|-----------------|------------------|-------|
| Email authentication | Y | Y | Y (Auth + profiles trigger) | Y (profiles) | N/A | P (web + Cap via remote URL) | N | P | Works when Supabase keys set; age 13+ on register |
| Password reset | Y | Y | Y (Supabase Auth) | N/A | N/A | P | N | P | `/forgot-password`, `/reset-password` |
| Google OAuth | Y | Y | N/A (provider config) | N/A | N/A | P (Browser + deep link) | N | P | Needs Dashboard providers + redirect URLs |
| Discord OAuth | Y | Y | N/A | N/A | N/A | P | N | P | Same as Google |
| Steam OAuth | Y (Soon toast) | N | N | N | N | N | N | N | Explicitly deferred |
| Hub discovery | Y | Y | Y | Y (hubs readable) | N | P | N | P | Live via `chat/api` or mock |
| Hub joining | Y | Y | Y | Y (join policy) | N | P | N | P | Auto-join on select; needs profile row |
| Hub create (user) | N (denied) | N (admin only) | Y (insert via service role / admin) | Y (no public insert) | N | P | N | Y* | *By product choice: admin-only |
| Hub chat | Y | Y | Y | Y | Y (channel messages) | P | N | P | Soft-delete + latest-N + channel unread (P5/P6) |
| Message editing | Y | Y | Y (`edited_at` + `message_edits`) | Y | P | P | N | P | History stored; no history UI panel yet |
| Message deletion | Y | Y | Y (`deleted_at` + RPCs) | Y (soft-delete; no client hard DELETE) | Y | P | N | P | Channel + DM soft-delete; admin soft-deletes |
| Reactions | Y | Y | Y (PK per user/emoji) | Y | P | P | N | P | Uniqueness constraint present |
| Mentions | P | P | Y (`06` / migration) | P | P (notif triggers) | P | N | P | Depends migrations applied |
| Pins | Y | Y | Y (`pinned`) | Y (hub-mod pin guard) | P | P | N | P | Cleared on soft-delete |
| Attachments | Y | Y | Y (`07` / Phase 8) | P (private + signed URLs + mime CHECK) | N | P | P (storage-policy unit) | P | MIME/size/sniff/quota; no AV scan yet |
| Friends | Y | Y | Y | Y | P | P | N | P | RPCs in phase3 SQL |
| Blocks | Y | Y | Y | Y | N | P | N | P | DM send + hub roster hide mutual blocks (P9) |
| DMs | Y | Y | Y | Y | Y | P | N | P | Unread via `last_read_at` (Phase 6) |
| DM video | Y (Soon) | N | N | N | N | N | N | N | Deferred |
| Hub voice | Y | Y | Y (voice_channels) | Y (read) | N/A | P | N | P | LiveKit reconnect + remint; stub if no keys |
| DM voice | Y | Y | N/A (room naming) | via token checks | N/A | P | N | P | `nexus-dm-{threadId}`; same reconnect path |
| Notifications (in-app) | Y | Y | Y | Y | Y | P | N | P | Separate from channel/DM unread |
| Push notifications | Y | Y | Y (P11) | Y | N | P | N | P | Web Push + APNs/FCM send when env set (P18f); CallKit deferred |
| Reports | Y | Y | Y (`04` / Phase 9) | Y | N | P | P (reason allowlist) | P | Reasons + DM targets + admin reviewing |
| Bans | Y (admin) | Y | Y (`banned_at`) | P | N | P | N | P | Client sign-out on banned profile |
| Admin tools | Y | Y | Y (`08` + `platform_roles`) | Bypass via service role after gate | N | P | P (`parseAdminIds`) | P | DB roles + `admin_audit_log` (Phase 3); env bootstrap |
| Account deletion | Y | Y | Y (P10 log) | N/A (Auth wipe) | N | P | N | P | Settings danger zone; hard CASCADE authored content |
| Arabic RTL | Y | N/A | N/A | N/A | N/A | P | N | P | EN/AR + RTL bootstrap + AR font (Phase 13); admin/SEO deferred |
| Capacitor iOS | Y | N/A | N/A | N/A | N/A | Y (remote shell) | P (`cap:smoke` + `smoke:launch`) | P | Dual-mode + ASC checklist (P18); SSR not in www; 4.2 reduced not eliminated |
| Cloudflare deployment | Docs/build target | Nitro CF | N/A | N/A | N/A | N/A | N | ? | Deploy/ops outside repo |
| Ops / health | Y (admin chips) | Y | N/A | N/A | N/A | N/A | P (`ops:health`) | P | `GET /api/health` + CI probe + alert hooks (P16f); full APM deferred |
| Rate limiting | P | Y (DB triggers) | Y | via INSERT/UPDATE triggers | N/A | P | P (mapRateLimitError) | P | Send/edit/reaction/report/friend; Auth/CF ops checklist |
| Presence / unread model | Y | Y | Y (`channel_member_states` + DM `last_read_at`) | Y | Y | P | N | P | Typing + DND + dock aggregates (Phase 6 follow-up) |
| 2FA | Y (Soon) | N | N | N | N | N | N | N | Settings stub |
| Billing / Nexus Plus | Y (Soon) | N | N | N | N | N | N | N | |
| GIF search | Y (Soon) | N | N | N | N | N | N | N | |
| Community Guidelines | Y | Y | N | N | N | P | N | Y | `/guidelines` (Phase 9) |
| Data export | Y | Y | N | via user JWT | N | P | N | P | JSON download Settings → Account |

---

## Column guidance (how to interpret)

- **DB migration in repo:** SQL exists under `supabase/migrations` and legacy `supabase/manual/01`–`08`. Does **not** prove they were applied — run `supabase/verify_schema.sql` per project.
- **RLS in SQL:** Policies exist in migration files. Spot-checks listed in LAUNCH.md are **manual**, not automated.
- **Realtime:** Message/DM/notif subscriptions exist in hooks; not exhaustively tested in CI.
- **Mobile verified:** Capacitor shell + safe-area code exist; real-device matrix incomplete / environment-dependent.
- **Production ready:** Marked **N** or **P** only. Nothing in this matrix is claimed **fully production ready** from Phase 0 alone.

---

## Highest gaps before public launch

1. Live ops: apply migrations + `verify_schema` on prod; fill LAUNCH.md checkboxes  
2. ASC screenshots / Review Notes / test account ([`docs/APP-STORE.md`](APP-STORE.md))  
3. Cap native push send (FCM/APNs) + honest store copy for remaining gaps  
4. Cap bundled client (reduce WebView-wrapper risk further)  
5. VoIP / CallKit (deferred from Phase 12)  
6. Full APM SDKs / TURN synthetics (see `docs/OPS.md`)  
7. Playwright / live RLS E2E against staging  
8. Play / Android CI  
