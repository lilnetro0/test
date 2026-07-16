# Community Game Home — Implementation QA

**Status:** Verification complete — **not production-ready**  
**Commit verified:** `efbd676` (*Redesign community IA into a native Game Home stack*)  
**Method:** Static code review of shipped sources against the approved IA plan. No new features were added during this QA.  
**Companion docs:** [`COMMUNITY-GAME-HOME-IA.md`](./COMMUNITY-GAME-HOME-IA.md), [`CURRENT-COMMUNITY-CHAT-FLOW.md`](./CURRENT-COMMUNITY-CHAT-FLOW.md) (legacy baseline)

### Verdict legend

| Mark | Meaning |
|------|---------|
| **PASS** | Implemented as specified in code |
| **PARTIAL** | Present but incomplete, inaccurate, or fragile |
| **FAIL** | Missing or contradicts the approved IA |
| **UNVERIFIED** | Cannot confirm without staging/prod runtime |
| **BLOCKER** | Must fix or explicitly accept before production |

---

## Executive summary

The route stack (`/` → `/c/$hubSlug` → `/c/$hubSlug/t/$channelSlug`), Game Home composition, voice room cards, LiveKit occupancy server fn, and `GlobalVoiceBar` are **shipped in code**. Several behaviors diverge from the approved product rules and must be treated as blockers or open risks:

1. **My Communities is not joined-only** — empty membership falls back to the full public hub catalog.
2. **Opening Game Home auto-joins** the hub (membership upsert) for any deep-linked slug.
3. **Capacity is UI-only** — `createVoiceToken` does not enforce soft capacity.
4. **Invalid hub/channel slugs** silently fall back; no recovery UI.
5. **Occupancy polling** does not stop on `document.hidden` / app background.
6. **Capacity migration** apply status on staging/production is **unverified**.
7. **No iPhone-width screenshots** of the new IA exist yet (existing walkthrough assets are pre-redesign).

**Do not claim production-ready until blockers below are resolved or explicitly waived.**

---

## 1. My Communities (`/`)

| Check | Result | Evidence |
|-------|--------|----------|
| Joined hubs only | **FAIL / BLOCKER** | [`src/routes/index.tsx`](../src/routes/index.tsx) lines 85–90: if `fetchUserHubs` returns `[]`, code calls `fetchLiveHubs()` and shows **all** hubs. Violates “joined only” and masks empty state. |
| Empty state for no communities | **PARTIAL** | [`MyCommunitiesList`](../src/components/community/my-communities-list.tsx) has empty UI, but live users with zero memberships never reach it because of the catalog fallback above. Mock mode always shows `GAMES`. |
| Resume behavior | **PASS** | `getLastHub()` / `setLastHub()` in [`prefs.ts`](../src/lib/prefs.ts); Game Home calls `setLastHub(slug)` in [`use-community.ts`](../src/hooks/use-community.ts); list shows “Continue” / متابعة when `lastHub === hub.id`. |
| Reorder persistence | **PASS** | Drag reorder → `setHubOrder` + optional `savePrefs({ hub_order })`. |
| Arabic RTL layout | **PARTIAL** | AR strings exist; `dir="auto"` on names; back chevron uses `rtl:rotate-180` on Game Home. My Communities header is logical but not RTL-designed as a unique composition (no device visual QA). |
| No accidental auto-join of every public hub | **FAIL / BLOCKER** | Catalog fallback lists public hubs; visiting any Game Home runs `joinHub(...)` upsert ([`use-community.ts`](../src/hooks/use-community.ts) ~155). Deep link to `/c/unknown-or-public` can create membership. |
| Last community persists across restarts | **PASS** | `localStorage` key `nexus.pref.lastHub`. Survives reload; not synced to server prefs. |

---

## 2. Game Home (`/c/$hubSlug`)

| Check | Result | Evidence |
|-------|--------|----------|
| Banner / icon / artwork / fallbacks | **PASS** | [`GameHomeHero`](../src/components/community/game-home-hero.tsx) uses `resolveBannerUrl` / `resolveIconUrl`; tint fallback when no banner. Ambient `resolveBackgroundUrl` optional. |
| Online count accuracy | **PARTIAL** | Hero uses `members.online.length` from `fetchHubMembers`. Activity strip uses LiveKit occupancy sum when configured. These can diverge. No presence table. |
| Activity data source accuracy | **PARTIAL** | Voice total = sum of occupancy members; unread = sum of channel unreads; LFG = channel name heuristic. Reasonable, not authoritative “what’s happening.” |
| Text channels ordered correctly | **PASS** (vs plan) | Featured sort: LFG first → unread desc → keep relative order ([`use-community.ts`](../src/hooks/use-community.ts) `featuredText`). DB `position` is secondary (stable after LFG/unread). |
| Voice rooms ordered correctly | **PASS** | `fetchChannels` orders voice by `position`. Occupancy merge preserves that order. |
| Capacity displayed correctly | **PARTIAL** | UI shows `n / max` when `capacity` set ([`VoiceRoomCard`](../src/components/community/voice-room-card.tsx)). Depends on migration applied. Fallback select without `capacity` if column missing. |
| Locked / full / empty / unavailable | **PARTIAL** | Empty + full (UI disable Join) + “You’re here” exist. **No locked / unavailable** room states. Full is client-only. |
| Loading / error / offline | **PARTIAL** | Loading: `ListSkeleton`. Error: toast only — page may still render wrong hub fallback. Offline: `CapOfflineBanner` only; no Game Home-specific offline empty. |
| Arabic + mixed-direction names | **PASS** (code) | `dir="auto"` on hub/channel/member names. |
| No web-like oversized blank areas | **UNVERIFIED** | Layout is single-column scroll; needs device visual review. Hero height `min(42dvh, 320px)` can feel tall on some phones. |

**Invalid hub slug:** live catalog miss falls back to `liveHubs[0]` or `GAMES[0]` — **no “hub not found” recovery** (**FAIL**).

---

## 3. Channel navigation (`/c/$hubSlug/t/$channelSlug`)

| Check | Result | Evidence |
|-------|--------|----------|
| Opens via `/c/$hubSlug/t/$channelSlug` | **PASS** | [`FeaturedChannels`](../src/components/community/featured-channels.tsx); chat route file exists. |
| Back → correct Game Home | **PASS** | Header `Link` to `/c/$hubSlug` with same `hubSlug`. |
| Deep links after cold launch | **PARTIAL** | Route params seed `useHubChat({ initialSlug, channelKey })`. Requires auth shell. Capacitor deep-link plumbing not re-tested here. |
| Invalid hub/channel recovery | **FAIL** | Invalid channel key: may select first channel or empty id; no dedicated recovery screen. Invalid hub: silent fallback (see §2). |
| Channel switch no stale messages | **PARTIAL** | Channel effect reloads messages; `channelRef` guards realtime. Mock mode shares one message list per hub (pre-existing). Live: switching should clear via fetch; brief stale flash possible. |
| Scroll restoration defined | **PARTIAL** | Router `scrollRestoration: true` ([`router.tsx`](../src/router.tsx)). **No** per-channel scroll-to-bottom / restore. Behavior = page-level only. |
| Unread clears correctly | **PASS** (live) | `markChannelRead` after fetch + on INSERT while viewing ([`use-hub-chat.ts`](../src/hooks/use-hub-chat.ts)). |
| Realtime messages | **PASS** (live) | Existing postgres_changes subscriptions retained. |
| Composer above iOS keyboard | **PASS** (infra) | `useKeyboardInset` + `--keyboard-inset` / dock collapse on keyboard open. Chat route uses same AppShell. Device confirmation still needed. |

---

## 4. Voice occupancy

| Check | Result | Evidence |
|-------|--------|----------|
| `listVoiceRoomOccupancy` returns live participants | **PASS** (when LiveKit configured) | [`list-voice-occupancy.ts`](../src/lib/voice/list-voice-occupancy.ts) uses `RoomServiceClient.listParticipants`. Empty / missing rooms → `[]`. Stub/unconfigured → empty members, `configured: false`. |
| One request per room vs batched per hub | **PARTIAL** | **One HTTP server fn per hub** from the client. Internally **N LiveKit `listParticipants` calls** (one per voice channel) — N+1 on the SFU side. 8s in-memory cache per `hubId`. |
| Polling interval | **PASS** | **12 000 ms** in `useCommunity` poll effect. |
| Stop when Game Home not visible | **PARTIAL** | Interval cleared on unmount (leaving Game Home). **Does not** listen to `document.visibilitychange` / `document.hidden`. |
| Stop when app backgrounded | **FAIL** | No Cap / Page Visibility pause. Polling continues while Game Home mounted in backgrounded WebView. |
| Stale LiveKit rooms | **PARTIAL** | Missing room errors → empty roster. Cache can show up to ~8s stale; no explicit stale-room cleanup. |
| No private participant metadata | **PASS** | Returns `userId` (LiveKit identity = Supabase uid), `name`, optional `muted`. No emails/tokens/IPs. |
| Capacity SQL applied staging/prod | **UNVERIFIED / BLOCKER** | Migration exists; apply status on remote DBs unknown from repo. |
| Full-room behavior | **PARTIAL** | UI disables Join when `count >= capacity`. Token mint **does not** check capacity (**BLOCKER** for soft-cap integrity). |
| Speaking / muted before & after Join | **PARTIAL** | Pre-join: muted from published tracks; **speaking not available**. Post-join: LiveKit client tracks speaking/mute in session; dock shows mute/deafen, not per-user speaking UI. |

---

## 5. GlobalVoiceBar

| Check | Result | Evidence |
|-------|--------|----------|
| Visible on all authenticated AppShell routes while connected | **PASS** | Mounted in [`AppShell`](../src/components/app-shell.tsx) above `BottomDock`. |
| Restores after route changes | **PASS** | Session from `getVoiceClient()` singleton + `onSessionChange`. |
| Restores after background/foreground | **PARTIAL** | In-memory session; LiveKit `disconnectOnPageLeave` may drop on full page leave. SPA background typically keeps session; not Cap-lifecycle tested. |
| Restores after returning to app | **UNVERIFIED** | Needs Capacitor cold/warm resume test. |
| No stale room/hub info | **PARTIAL** | Shows `session.channelName`. `gameName` is generic (“Voice rooms” / preview) — not hub-bound, so hub switch won’t retitle wrongly, but also won’t show hub context. |
| Switching communities ≠ switching voice room | **PASS** | Voice join only from Game Home Join; hub navigation does not call leave/join. |
| Leaving voice clears global state | **PASS** | `leaveVoiceChannel` → session null → bar unmounts. |
| Reconnect / permission / disconnected UI | **PARTIAL** | Reconnecting amber state in `VoiceDock`. Mic permission: silent degrade to muted join (no banner). Disconnected: bar disappears. |
| Safe-area + dock clearance | **PARTIAL** | Bar sits in flex column above dock (`pb-safe` on dock). Sheets use `--dock-clearance` which includes keyboard inset but **may not include VoiceBar height** when open — risk of sheet/composer overlap (**needs device check**). |
| No overlap sheets / keyboard / composer | **UNVERIFIED** | Architecture places bar between content and dock; chat composer is inside content. Overlap risk when VoiceBar + keyboard + sheet open. |

---

## 6. Voice authorization

| Check | Result | Evidence |
|-------|--------|----------|
| Server verifies hub membership (token) | **PASS** | [`createVoiceToken`](../src/lib/voice/create-voice-token.ts) checks `hub_members` for channel’s `hub_id`. |
| Server verifies voice-channel access | **PASS** | Channel must exist in `voice_channels`. |
| Capacity cannot be bypassed via direct token | **FAIL / BLOCKER** | No capacity check in token mint. UI disable is advisory only. |
| Banned users cannot receive tokens | **PASS** | `profiles.banned_at` check. |
| Rate limiting active | **PASS** | `claim_voice_token_mint` RPC + local fallback 12/min. |
| Roster only for authorized hubs | **PASS** | Occupancy fn requires `hub_members` for `hubId`. |

---

## 7. URL and legacy migration

| Check | Result | Evidence |
|-------|--------|----------|
| `/` is My Communities | **PASS** | [`index.tsx`](../src/routes/index.tsx) rewritten. |
| `/?hub=` redirects without loops | **PASS** | `replace: true` navigate to `/c/$hubSlug`. |
| Discover → `/c/$slug` | **PASS** | [`discover.tsx`](../src/routes/discover.tsx). |
| Profile / Me / command palette → `/c/$slug` | **PASS** | Retargeted in those files. |
| Browser + Capacitor deep links | **UNVERIFIED** | Routes registered; Cap deep-link config not exercised in this QA. |
| Query params only when intentional | **PASS** | Hub no longer kept as sticky `?hub=` after redirect. |
| Back history no redirect noise | **PASS** | Legacy hub redirect uses `replace: true`. |

`/?hubs=1` is accepted by search validation but **no longer opens a hub sheet** (sheet removed) — **PARTIAL** / dead param.

---

## 8. Database and deployment

### Migration: `supabase/migrations/20260716180000_voice_channel_capacity.sql`

```sql
alter table public.voice_channels add column if not exists capacity int;
-- backfill: update ... set capacity = 8 where capacity is null;
```

| Check | Result |
|-------|--------|
| Why `manual/10_voice_capacity.sql` also exists | **Documented** — identical SQL for dashboard paste when migrations aren’t auto-applied (Lovable/manual ops pattern). |
| Two sources of truth | **PARTIAL risk** — files are currently **identical**. Prefer migration as canonical; manual is apply helper. Drift risk if one is edited alone. |
| Migration order | Timestamp `20260716180000` after prior July 2026 migrations — OK in tree. |
| Rollback | **No down migration.** Rollback = `alter table ... drop column capacity` manually. |
| Validation / defaults | **PARTIAL** — no CHECK constraint (`capacity > 0`); null allowed (count-only UI); backfill sets 8. Templates seed capacity 5/8. |
| Existing channels backfilled | **In SQL yes** (`update ... where capacity is null`). **Whether applied on staging/prod: UNVERIFIED.** |

---

## 9. Performance

| Check | Result |
|-------|--------|
| Game Home initial render measured | **NOT MEASURED** |
| Occupancy polling cost | **Estimated:** every 12s → `fetchChannels` + occupancy server fn; occupancy may hit LiveKit **once per voice channel**. Cache 8s reduces repeat SFU load within TTL. |
| Avoid N+1 | **FAIL (SFU)** — N `listParticipants` per hub occupancy refresh. Client is 1 request/hub. |
| Lazy-load artwork | **FAIL** — banner/bg `<img>` without `loading="lazy"` / srcset strategy beyond existing resolvers. |
| Avoid full participant details unless displayed | **PARTIAL** — full roster returned; UI shows first 5 + overflow. Extra names still over the wire. |
| Mid-range iPhone | **UNVERIFIED** |
| Unstable mobile network | **UNVERIFIED** — occupancy errors swallowed to empty; toast on Game Home join/load errors only. |

---

## 10. Visual review / screenshots

| Requested shot | Status |
|----------------|--------|
| My Communities (EN/AR) | **NOT CAPTURED** for new IA |
| Empty My Communities | **NOT CAPTURED** (and currently hard to reach in live due to catalog fallback) |
| Game Home | **NOT CAPTURED** |
| Game Home + active voice | **NOT CAPTURED** |
| Full voice room | **NOT CAPTURED** |
| Empty voice room | **NOT CAPTURED** |
| Text channel | **NOT CAPTURED** |
| GlobalVoiceBar on another route | **NOT CAPTURED** |
| Loading / error | **NOT CAPTURED** |

**Note:** Existing assets under `docs/ui-walkthrough/` document the **pre–Game Home** sheet-first Home. They must **not** be used as proof of this redesign.

---

## Production blockers

1. **Joined-only My Communities** — remove `fetchLiveHubs` empty fallback; show real empty state.  
2. **Stop silent auto-join** on Game Home open (or gate deep links / Discover-only join).  
3. **Enforce capacity in `createVoiceToken`** (or drop soft-cap product claim).  
4. **Invalid hub/channel recovery UI** — no silent fallback to wrong community.  
5. **Confirm capacity migration applied** on staging + production.  
6. **Pause occupancy polling** when `document.hidden` / app backgrounded.  
7. **Capture iPhone-width EN+AR screenshots** of the new IA before visual sign-off.  
8. **Sheet / VoiceBar / keyboard overlap** validated on device.

---

## Unresolved issues (non-blocker / follow-up)

- Occupancy N LiveKit calls per hub (batch/`listRooms` optimization).  
- No speaking indicators pre-join (expected LiveKit limitation).  
- GlobalVoiceBar lacks hub context label.  
- `/?hubs=1` dead parameter.  
- Scroll-to-bottom / per-channel scroll restore undefined.  
- Online strip vs LiveKit voice count can disagree.  
- Dual SQL files need a single canonical note in ops docs.  
- Artwork lazy-loading.  
- Manual RTL device QA not run.  
- Capacitor deep-link cold start not exercised.

---

## Exact files changed (shipped redesign `efbd676`)

46 files, +2907 / −908. Principal surfaces:

| Area | Paths |
|------|-------|
| Docs | `docs/COMMUNITY-GAME-HOME-IA.md`, `docs/CURRENT-COMMUNITY-CHAT-FLOW.md` |
| Routes | `src/routes/index.tsx`, `c.$hubSlug.tsx`, `c.$hubSlug.index.tsx`, `c.$hubSlug.t.$channelSlug.tsx`, discover/dm/me/profile/friends/notifications/`__root`, `routeTree.gen.ts` |
| Community UI | `src/components/community/*`, `global-voice-bar.tsx`, `app-shell.tsx`, `bottom-dock.tsx`, `command-palette.tsx`, `app-nav.tsx` |
| Hooks / voice | `use-community.ts`, `use-hub-chat.ts`, `list-voice-occupancy.ts`, `server/voice.ts` |
| Data | `chat/api.ts`, `prefs.ts`, `mock-data.ts`, `hub-templates.ts`, `admin/api.ts`, `supabase/types.ts`, `dto.ts`, i18n, styles |
| SQL | `supabase/migrations/20260716180000_voice_channel_capacity.sql`, `supabase/manual/10_voice_capacity.sql` |

*(Plus incidental polish edits in auth-shell, hub-hero, legal-page, message-item, game-icon, capacitor.)*

---

## Tests run

| Test | Result |
|------|--------|
| Automated unit/e2e for Game Home IA | **None dedicated** |
| `tsc --noEmit -p tsconfig.ci.json` (during implementation) | Reported clean at ship time; **not re-run as formal QA gate in this document session** |
| Manual device / RTL / Cap deep-link | **Not run** |
| Staging LiveKit occupancy / capacity SQL | **Not verified** |
| Screenshot capture for new IA | **Not run** |

---

## Migrations applied

| Environment | `voice_channels.capacity` |
|-------------|---------------------------|
| Repo (migration + manual SQL) | Present |
| Local / staging / production | **UNVERIFIED** — must confirm in each Supabase project before capacity UX is trusted |

Recommended verify:

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'voice_channels'
  and column_name = 'capacity';

select count(*) as null_capacity
from public.voice_channels
where capacity is null;
```

---

## Screenshots

**None for the Community Game Home IA.**

Do not treat `docs/ui-walkthrough/**` as evidence for this redesign.

---

## Final readiness statement

The Community Game Home IA is **approved conceptually** and **partially implemented**. Static verification found **multiple production blockers** (membership fallback, auto-join, capacity bypass, invalid-slug fallback, background polling, unverified migration, missing visual QA).

**Stabilization follow-up:** see [`COMMUNITY-GAME-HOME-STABILIZATION.md`](./COMMUNITY-GAME-HOME-STABILIZATION.md). Fresh screenshots: [`ui-walkthrough/game-home/`](./ui-walkthrough/game-home/). **Still not production-ready** until physical iPhone EN/AR QA is signed off.
