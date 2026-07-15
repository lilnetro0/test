# Capacitor — Nexus

**Phase:** 15 (+ follow-up)  
**Date:** 2026-07-15

## Dual mode (honest)

| Mode | When | What loads | createServerFn |
|------|------|------------|----------------|
| **Remote** (TestFlight / store path) | `CAPACITOR_SERVER_URL=https://…` | WKWebView → deployed Nexus | Works (server is the Worker) |
| **Local** (dev shell only) | URL unset | `www/index.html` offline explanation | **Does not work** |

Local `www/` is **not** a bundled SSR app. Copying `.output/public` into Cap does **not** host Nitro. Phase 15 keeps remote-shell for production and fails closed when CI expects remote.

## Env

```bash
CAPACITOR_SERVER_URL=https://your-domain.com   # no trailing slash
# Optional: SITE_URL used as fallback
CAPACITOR_REQUIRE_SERVER=1                     # prepare exits if URL missing (CI)
VITE_SUPABASE_URL=https://xxxx.supabase.co     # also added to allowNavigation
```

Supabase Auth redirect allow-list:

```
com.lilnetro0.nexus://auth/callback
```

## Scripts

| Script | Role |
|--------|------|
| `npm run cap:prepare` | Writes `www/` bridge (remote) or local shell |
| `npm run cap:sync` | prepare → `cap sync` → inject (requires HTTPS URL) |
| `npm run cap:sync:local` | prepare + sync **without** inject (local shell) |
| `npm run cap:inject-server` | Fail-closed: sets iOS `server.url` + `allowNavigation` |
| `npm run cap:smoke` | Packaging smoke (no simulator) — also in Codemagic `web-smoke` |
| `npm run mobile:ios` | `build` + `cap:sync` |

Codemagic:

- `web-smoke` → `npm run build` + `npm run cap:smoke`
- `ios-capacitor` → URL check, `CAPACITOR_REQUIRE_SERVER=1`, prepare → sync ios → inject → IPA → TestFlight

## Security / bounding

Remote Cap config sets `server.allowNavigation` to:

- Deploy hostname (+ `www.` twin)
- `VITE_SUPABASE_URL` / `SUPABASE_URL` host (when set at sync time)

Inject mirrors that into `ios/App/App/capacitor.config.json` (gitignored).

## Connectivity UX

1. Remote bridge `www/index.html` — fetch then `location.replace`; Retry if stuck  
2. In-app `CapOfflineBanner` — Cap + `navigator.onLine` offline strip with reload  

## Native chrome (already present)

- StatusBar / Keyboard / Splash — `src/lib/capacitor.ts`  
- Push register — `@capacitor/push-notifications` (APNs **send** deferred)  
- AVAudioSession — `AppDelegate.swift`  
- Keyboard inset — Phase 14 follow-up  

After plugin adds: run `npx cap sync ios` so CapApp-SPM picks up SPM deps (incl. push). `cap:smoke` warns if Package.swift still lacks push.

## Guideline 4.2 — review notes (not a free pass)

Remote WebView remains the load model. For App Store notes, call out **native** value already in the binary:

- Custom URL scheme + Cap Browser OAuth close  
- Push notification permission / device register  
- Keyboard resize + safe-area chrome  
- Background audio session for LiveKit voice  
- Offline banner when connectivity drops  

Guideline **4.2** paste template for App Review Notes lives in [`docs/APP-STORE.md`](APP-STORE.md).

## Android (scaffold path)

No `android/` folder is committed today. When ready:

```bash
npx cap add android
# set CAPACITOR_SERVER_URL
npm run cap:prepare
npx cap sync android
# signing + Play track = ops
```

Codemagic workflow **`android-capacitor`** is defined and **fail-closed** until `android/` exists (then assembleRelease). Play Console signing / AAB publish stays ops.

`cap:smoke` warns when `android/` is missing.

## Why a bundled Cap SPA stays deferred

TanStack Start `createServerFn`, auth cookies, and Nitro routes are **origin-bound**. Shipping only static files in `webDir` cannot run that server. Submit path remains **remote HTTPS shell + native capabilities** (`docs/APP-STORE.md` Review Notes). A future split (BFF / SPA client) is a product architecture change — not a packaging flag.

## Still deferred

- Offline SSR inside Cap webDir / SPA-only launch binary (see rationale above)  
- Play Console AAB signing automation (Codemagic scaffold exists)  
- VoIP/CallKit  
- Full device E2E Cap CI (simulator flows)  
- FCM HTTP v1  
