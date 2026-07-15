# Push notifications — Nexus

**Phase:** 11 (+ follow-up)  
**Date:** 2026-07-15

## What shipped

| Piece | Role |
|-------|------|
| `push_devices` | Web PushSubscription JSON (`web`) or Cap tokens (`ios`/`android`) |
| `user_prefs.push_enabled` | Settings opt-in |
| Prefs filters | `notif_sound`, `notif_mentions_only`, `notif_match_dnd` |
| Settings → Notifications | Desktop + sound + mentions-only + fullscreen DND (toast) |
| Cap register | `@capacitor/push-notifications` → `push_devices` |
| `sendPushToUser` | Web Push (VAPID) + APNs (iOS) + FCM legacy (Android) when env set |
| `/api/push-dispatch` | Ops webhook with `PUSH_DISPATCH_SECRET` |
| `public/sw.js` | `push` + `notificationclick` handlers |

Foreground UX remains Realtime + toast (+ optional beep). Push is for **background / other devices**.

## Prefs behavior

| Pref | Effect |
|------|--------|
| `notif_sound` | Short beep with in-app toast (default on) |
| `notif_mentions_only` | Skip toast + Web Push unless `kind = mention` |
| `notif_match_dnd` | Silence **toasts** while `document.fullscreenElement` (does not suppress webhook push) |

## Env (server)

```bash
# Generate: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:safety@nexus.app

VITE_VAPID_PUBLIC_KEY=                   # same as VAPID_PUBLIC_KEY
PUSH_DISPATCH_SECRET=long-random-string
```

## Ops: Database Webhook (recommended)

Supabase → Database → Webhooks → on `notifications` **INSERT** → `https://YOUR_SITE/api/push-dispatch` with header `x-nexus-push-secret`.

## Capacitor / iOS

1. Plugin: `@capacitor/push-notifications` (installed) — run `npx cap sync ios` after pull.
2. Enabling Desktop on native registers APNs/FCM **token** into `push_devices`.
3. **Send paths (Phase 18 follow-up):**
   - iOS → APNs token auth when `APNS_KEY_ID` + `APNS_TEAM_ID` + `APNS_P8` (or `APNS_P8_BASE64`) set
   - Android → FCM legacy HTTP when `FCM_SERVER_KEY` set
4. Apple Push capability + Codemagic entitlements remain ops. CallKit / VoIP push still deferred (`VOICE.md`).

## Env (server) — native send

```bash
APNS_KEY_ID=
APNS_TEAM_ID=
APNS_BUNDLE_ID=com.lilnetro0.nexus
APNS_P8=-----BEGIN PRIVATE KEY-----…
# or APNS_P8_BASE64=
APNS_PRODUCTION=1
FCM_SERVER_KEY=          # Android Cap; optional
```

## Migrations

- `20260715210000_phase11_push_devices.sql`
- `20260715211000_phase11_followup_notif_prefs.sql`

## Out of scope / unresolved

- FCM HTTP v1 (service-account JWT) — legacy key path only for now  
- Match DND suppressing webhook/server push  
- Reporter outcome / deletion email templates (no mail transport in repo)  
- VoIP / LiveKit CallKit push (`VOICE.md`)
