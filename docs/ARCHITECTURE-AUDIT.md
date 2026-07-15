# Architecture Audit — Nexus / Game Hub Connect

**Phase:** 0  
**Date:** 2026-07-15  
**Scope:** Read-only repository inspection + baseline tooling checks. No production schema mutations performed.

---

## 1. System map

```
[iOS Capacitor WebView] --CAPACITOR_SERVER_URL--> [TanStack Start SSR (Nitro → Cloudflare)]
         |                                              |
         |                                              +--> Browser Supabase (anon): Auth, Realtime, Storage, RLS queries
         |                                              +--> createServerFn: service role / user JWT (admin, voice, stubs)
         |
         +--> LiveKit (via tokens from server) <---------- livekit-server-sdk
```

| Concern | Implementation |
|---------|----------------|
| Auth | Supabase Auth; `src/lib/supabase/auth.ts`; `AuthProvider` |
| Profiles | `profiles`, `user_prefs`; ensure/backfill SQL |
| Games | Catalog table `games`; Discover art / category via `Game.gameId` |
| Hubs | Joinable `hubs` (`game_id` → `games`); URL/join via `hubs.slug`; see `docs/DOMAIN-MODEL.md` |
| Channels | `text_channels`, `voice_channels` |
| Membership | `hub_members` roles `admin\|mod\|member` — Phase 4 enforces mod+ pin/delete/kick; hub admin set-role |
| Messages | `messages`, `message_reactions`; client `chat/api` + Realtime |
| DMs | `dm_*` tables; `social/api` + hooks |
| Notifications | `notifications` + triggers (phase4 SQL) |
| Storage | Buckets avatars/attachments/hub-media (07/08) |
| LiveKit | `createVoiceToken` + `livekit-client` / stub |
| Admin | `platform_roles` + `ADMIN_USER_IDS` bootstrap + `src/lib/admin/authz.ts` / `/admin` |
| Reports / bans | `reports`, `profiles.banned_at` |
| Capacitor | `ios/`, remote `server.url`, Codemagic IPA |
| Cloudflare | Nitro Cloudflare output (vite-tanstack-config) |

---

## 2. Frontend

- **Stack:** React 19, TanStack Router/Start/Query, Vite 8, Tailwind 4, Radix/shadcn UI kit.
- **Routes:** `/`, `/discover`, `/dm`, `/friends`, `/notifications`, `/me`, `/profile/$username`, `/settings`, auth routes, `/admin`, legal, `/help`.
- **Shell:** `AppShell` + `BottomDock`; EN/AR i18n with RTL variants.
- **Mock path:** `shouldUseMockData()` when keys missing or `VITE_USE_MOCK=1`.
- **Direct browser Supabase:** extensive — chat, social, profile, storage, notifications — via anon + RLS.
- **Server FN usage:** hubs/messages/friends/dms/notifications stubs, voice token, admin API, `getAppHealth` / dual health.

---

## 3. Backend / data

### SQL inventory

| Path | Kind | Notes |
|------|------|-------|
| `supabase/00_reset_nexus.sql` | **Stub (blocked)** | Raises; real wipe in `dangerous/` |
| `supabase/dangerous/00_reset_nexus.sql` | **Destructive (gated)** | Session `nexus.allow_destructive_reset=I_UNDERSTAND` — local/empty only |
| `supabase/migrations/20260715000000_nexus_core.sql` | Schema + RLS | Core model |
| `01_backfill_profiles.sql` / ensure migrations | Backfill / ops | Profile FK repairs (`supabase/manual/`) |
| `02` / phase3 friends DMs | Schema + RPCs | |
| `03` / phase4 notifications | Triggers | |
| `04` / phase6 launch | Reports + bans | |
| `05` security hardening | Policies | |
| `06` mention tag | Mentions | |
| `07` storage | Buckets + columns | |
| `08` admin ops | Media + role bypass | |
| `seed.sql` | Demo seed | Games/hubs/channels |

Mirrored cloud paste scripts (`00`–`08`) duplicate much of `migrations/` — Phase 1 must single-source order of truth.

### RLS

Enabled on core public tables in `nexus_core.sql` with member-scoped policies for channels/messages/DMs/notifications. Admin mutations primarily use **service role**, bypassing RLS. Hub insert for ordinary clients is not granted (create is admin path).

### Privileged server access

`getSupabaseAdminClient()` reads `SUPABASE_SERVICE_ROLE_KEY` (never `VITE_`). Used for admin CRUD, health, and some privileged paths. Voice mint uses LiveKit secrets server-side and membership/ban checks.

---

## 4. Auth & identity

| Provider | Status |
|----------|--------|
| Email/password | Implemented |
| Password reset | Implemented |
| Google / Discord OAuth | Client implemented; Cap Browser + `com.lilnetro0.nexus://auth/callback` |
| Steam | UI Soon only |
| Account deletion | Implemented (Phase 10 Settings) |
| Session list / revoke all | Partial — global + “sign out others” (no device list) |
| Platform roles table | Implemented (Phase 3 `platform_roles`) |

---

## 5. Product feature classification

### UI + backend (code present)

Email/password auth, profiles, hub discover/join, chat (send/edit/react/pin paths), friends/blocks/DMs, in-app notifications Realtime, LiveKit or stub voice, admin console, reports/bans scaffolding, storage upload helpers, Cap iOS remote shell, Codemagic YAML.

### UI only / Soon

Steam; DM video; GIF picker; large parts of Settings (2FA, billing upgrade, many toggles); some friend “call” affordances.

### Backend SQL present but ops-dependent

Anything requiring manual apply of migrations/`05`–`08` on the cloud project — **cannot assume applied**.

### Missing entirely (vs hardening plan)

Malware scan pipeline, full APM SDKs (P16f: JSON log drain + Slack/PagerDuty hooks + `ops:health` CI; see `docs/OPS.md`), Cap native FCM/APNs send.

(Push registry + Web Push: Phase 11. Account lifecycle: Phase 10. Trust & safety: Phase 9. Ops probe + alerts: Phase 16 + follow-up.)

---

## 6. Permissions: where enforced

| Layer | Examples |
|-------|----------|
| RLS | Member channel message read/write; own profile update; DM participant isolation |
| Server (JWT + service) | Voice token membership/ban; admin allowlist gate |
| UI only / insufficient | Many Settings “Soon” toggles; Discover create-hub toast for non-admins (DB also blocks public insert) |
| Coarse hub roles | `hub_members.role` enum without channel overrides |

---

## 7. Environment variable consumption

| Variable | Consumed by | Client-visible? |
|----------|-------------|-----------------|
| `VITE_SUPABASE_URL` | `env.ts`, clients | Yes |
| `VITE_SUPABASE_ANON_KEY` | `env.ts`, clients | Yes |
| `VITE_USE_MOCK` | `shouldUseMockData` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | `server.ts` admin | No |
| `ADMIN_USER_IDS` | `admin/api.ts` | No |
| `LIVEKIT_*` | voice token server | No |
| `SITE_URL` | sitemap / OAuth base / Cap fallback | Server / build |
| `CAPACITOR_SERVER_URL` | Cap config + Codemagic inject | Build-time |

No fail-closed production env validator: missing keys → mock or null clients.

---

## 8. Capacitor / Codemagic

- App ID `com.lilnetro0.nexus`; plugins: app, browser, keyboard, splash, status-bar.
- Remote HTTPS shell: required for SSR/server fns.
- Codemagic: `web-smoke`, `ios-capacitor` with App Store signing + TestFlight publish; env group `test` expected to hold `CAPACITOR_SERVER_URL`.
- Placeholder page if URL not injected at sync.

---

## 9. Design / i18n / mobile notes

- Dark OKLCH tokens; Space Grotesk + Inter; dock-centric IA.
- EN/AR strings; RTL class variants + early dir bootstrap + Noto Sans Arabic (Phase 13); unused `ui/*` physical CSS + admin i18n deferred.
- Phone dock clearance tokens + modal sheets above dock (Phase 14); Cap dual-mode remote shell + allowNavigation (Phase 15); true bundled SSR still impossible in webDir.
- Ops: public `GET /api/health`, structured `logEvent`, Admin dual chips, `docs/OPS.md` (Phase 16); CI `ops:health`, LiveKit HTTPS reachability, Slack/PD alert hooks (P16f).
- Launch: `docs/APP-STORE.md` + `smoke:launch` + rewritten `LAUNCH.md` (Phase 18).

---

## 10. Dead code / dependency smell (do not remove yet)

Likely lightly used / shadcn leftovers not imported by app routes:

- `recharts` / `components/ui/chart.tsx`
- `embla-carousel-react` / `carousel.tsx`
- `react-day-picker` / `calendar.tsx`
- `input-otp` / `input-otp.tsx`
- `react-resizable-panels` / `resizable.tsx`

Also: duplicated SQL between numbered cloud scripts and `migrations/`; stale LAUNCH.md deferrals; `src/server/*` list/send stubs may overlap browser `chat/api` / `social/api` paths (confirm call graph before deleting).

Hand-written `Database` types include `Relationships` for common embeds + friend/DM RPCs (Phase 17/17f); full `tsc` green. Prefer `supabase gen types` long-term.

---

## 11. Baseline tooling

| Command | Outcome |
|---------|-------------------|
| `npx tsc --noEmit` / `typecheck:full` | **Pass** (Phase 17 follow-up) |
| `npm run typecheck` | **Pass** — scoped `tsconfig.ci.json` |
| `npx eslint src` (full + prettier) | Style volume — not CI-gated; use `lint:ci` |
| `npm run lint:ci` | **Pass** — non-prettier rules (Phase 17f) |
| Unit tests | **Pass** — Vitest `npm test` |
| `npm run smoke:security` | **Pass** — CSRF/headers/env/RLS artifacts/audit |
| `npm run build` | **Passed** (Phase 0) — Nitro Cloudflare build OK |

**Important:** Do not treat Codemagic IPA success as evidence that full-repo TypeScript is clean or that RLS was verified against production.

---

## 12. Recommended engineering priorities (post Phase 18)

1. Execute `LAUNCH.md` / `APP-STORE.md` ops checklists on live environments.  
2. Cap native push send + VoIP/CallKit if product-critical.  
3. E2E / live RLS tests when staging credentials exist.  
4. Cap bundled client when WebView risk becomes a submit blocker.  
5. Android / Play when expanding platforms.

---

## 13. Explicit non-claims

Phase 0 does **not** claim that:

- production Supabase has all SQL applied;
- Cloudflare is deployed;
- TestFlight build uses current safe-area code;
- LiveKit is configured;
- OAuth providers are enabled;
- the app is App Store review-ready.
