# Community Game Home — Stabilization Report

**Date:** 2026-07-16  
**Scope:** Production-readiness pass (no new product features)  
**Prior QA:** [`COMMUNITY-GAME-HOME-QA.md`](./COMMUNITY-GAME-HOME-QA.md)

---

## Verdict

**Not production-ready yet.** Code blockers are fixed, `tsc` is clean, capacity is present on the configured `.env` Supabase project (`…ajopzc`), and **fresh browser EN/AR screenshots** are in [`docs/ui-walkthrough/game-home/`](./ui-walkthrough/game-home/). Remaining gate: **physical iPhone EN/AR device QA** (safe areas, keyboard, Cap deep links, long session). If staging/production are separate Supabase projects from `.env`, confirm capacity there too.

---

## Blockers resolved (code)

| # | Blocker | Resolution |
|---|---------|------------|
| 1 | Auto-join on `/c/...` | `useCommunity` / `useHubChat` only **check** membership. Explicit `joinCommunity()` / Game Home CTA. Discover **opens preview**, does not join. |
| 2 | My Communities public fallback | `/` uses `fetchUserHubs` only. Empty state shows Discover + recommended/featured **previews** (not memberships). |
| 3 | Capacity UI-only | `createVoiceToken` loads `capacity`, calls LiveKit `listParticipants`, returns `ROOM_FULL` when full (allows rejoin if already in room). |
| 4 | Silent hub/channel fallback | `CommunityNotFound` / `ChannelNotFound` / `MembershipRequired`. Chat no longer falls back to another hub’s game card. |
| 5 | Occupancy poll while hidden | Poll starts/stops on `visibilitychange` + unmount in `useCommunity`. |
| 6 | Dual SQL drift risk | Migration is SoT; manual file is paste helper with identical SQL + comment. Configured `.env` project: **CAPACITY_PRESENT**. |
| 7 | N× `listParticipants` | `listRooms(hubRoomNames)` first; hydrate roster only for active rooms. Documented LiveKit limitation (no batch roster API). |

---

## Other items

| # | Item | Status |
|---|------|--------|
| 8 | Global Voice Bar | Shows community name, room name, connected / reconnecting / mic-denied states via `VoiceDock` + session fields. |
| 9 | Community Home hierarchy | Visitor preview + join CTA; member home prioritizes hero → online → activity → voice → channels. Reserved feed slot. |
| 10 | Permissions extension | `src/lib/community/permissions-ext.ts` — roles/voice caps/settings sections (not enforced). |
| 11 | Community Feed architecture | `src/lib/community/feed-ext.ts` + hidden `#community-feed` slot on Game Home. |
| 12 | Performance | Occupancy: listRooms + selective listParticipants + 8s cache; poll pause when hidden; `loading="lazy"` on list/banner artwork; Game Home hero `eager`. |
| 13 | Device QA (iPhone EN/AR) | **Browser proxy done** (390×844, EN+AR RTL). **Physical iPhone still outstanding.** |
| 14 | Fresh screenshots | **Captured** → [`docs/ui-walkthrough/game-home/`](./ui-walkthrough/game-home/) (do not use older `docs/ui-walkthrough/en|ar` sets). |

---

## Migration verification

**Source of truth:** `supabase/migrations/20260716180000_voice_channel_capacity.sql`  
**Manual twin:** `supabase/manual/10_voice_capacity.sql` (dashboard paste only)

| Environment | `voice_channels.capacity` |
|-------------|---------------------------|
| Repo | Present |
| `.env` project (`…ajopzc`) | **PRESENT** — PostgREST `select=capacity` HTTP 200 (2026-07-16) |
| `.env.local` Vite URL | Empty / mock-forced — no second host |
| Staging / production (if other projects) | **Confirm separately** |
| Local Docker Supabase | Not running — unverified |

Also fixed during screenshot QA: empty My Communities crashed without `EmptyState` `icon` prop; mock `?empty=1` search flag for empty-state captures; mock invalid channel no longer falls back to first channel.

---

## LiveKit occupancy limitation

LiveKit Room Service does **not** expose a batch participant roster. After `listRooms`, each **active** room still needs `listParticipants` for identities/mute state. Empty rooms skip that call when `listRooms` succeeds.

---

## Files changed (this pass)

### Core membership / recovery
- `src/hooks/use-community.ts` (already rewritten — no auto-join; poll pause)
- `src/hooks/use-hub-chat.ts` — no silent game fallback; membership gate
- `src/lib/chat/api.ts` — `fetchHubBySlug`, `checkHubMembership`
- `src/components/community/recovery.tsx` — not found + membership required
- `src/routes/index.tsx` — joined-only + recommended for empty state
- `src/components/community/my-communities-list.tsx` — empty CTAs
- `src/routes/c.$hubSlug.index.tsx` — visitor join, recovery, feed slot, hierarchy
- `src/routes/c.$hubSlug.t.$channelSlug.tsx` — recovery screens
- `src/routes/discover.tsx` — preview navigate (no join)

### Voice
- `src/lib/voice/create-voice-token.ts` — server capacity / `ROOM_FULL`
- `src/lib/voice/list-voice-occupancy.ts` — listRooms optimization + docs
- `src/lib/voice/types.ts`, `livekit-client.ts`, `livekit-stub.ts` — hubName / micDenied
- `src/components/global-voice-bar.tsx`, `src/components/voice-dock.tsx`

### Extension points / i18n / SQL
- `src/lib/community/permissions-ext.ts`
- `src/lib/community/feed-ext.ts`
- `src/lib/i18n.tsx` — EN/AR recovery, visitor, empty, voice status
- `supabase/migrations/20260716180000_voice_channel_capacity.sql`
- `supabase/manual/10_voice_capacity.sql`

---

## Remaining known limitations

1. **Physical iPhone EN/AR QA** still outstanding (safe areas, keyboard, Cap deep links, bg/fg, long session). Browser 390×844 EN/AR proxy completed.
2. **Staging/production capacity** — confirm if those are separate from `.env` project `…ajopzc` (PRESENT).
3. Soft capacity race under simultaneous joins near the cap.
4. Permissions / Community Feed are stubs only.
5. Occupancy: 1× `listParticipants` per active room (LiveKit limitation).
6. Mock mode always treats users as members — visitor Join CTA needs live Supabase to screenshot.

---

## Screenshots (fresh)

Index: [`docs/ui-walkthrough/game-home/README.md`](./ui-walkthrough/game-home/README.md)

Covers My Communities, empty, Community Home, active/empty voice, text chat, Global Voice Bar, loading, community/channel errors — EN + AR.

---

## Production readiness assessment

| Gate | Status |
|------|--------|
| Auto-join removed | Fixed |
| Joined-only My Communities | Fixed |
| Server capacity enforcement | Fixed |
| Recovery screens | Fixed |
| Occupancy poll pause | Fixed |
| Migration on configured `.env` project | **PRESENT** |
| Fresh screenshots EN/AR | **Done** (browser) |
| Physical iPhone EN/AR QA | **Open** |

**Assessment:** Stabilization is code-complete for listed blockers; browser visual QA attached. **Do not mark production-ready** until physical iPhone EN/AR verification is signed off (and capacity on any additional Supabase projects).
