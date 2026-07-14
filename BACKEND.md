# Nexus Backend (Supabase)

Phases 0–7 are in place. With Supabase keys set, the app uses **live** hubs/chat/friends by default. Set `VITE_USE_MOCK=1` to force mock UI.

## Architecture

- **Supabase Auth** — email/password (OAuth later)
- **Postgres** — hubs, channels, messages, friends, DMs, notifications, prefs
- **Realtime** — channel `messages` (Phase 2); DMs/notifications in later phases
- **Storage** — avatars/attachments (post-launch)
- **LiveKit** — voice (Phase 5; `src/lib/voice/` + `src/server/voice.ts`)

```
React UI  →  browser Supabase client (auth + realtime)
          →  createServerFn (`src/server/*`) → service role / user JWT
```

## 1. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. Project Settings → API:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` `public` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**server only**, never `VITE_`)

## 2. Local env

```bash
cp .env.example .env
# fill URL + anon + service_role
```

Lovable: add the same keys in project environment settings. Do **not** put the service role in any `VITE_*` variable.

## 3. Apply schema

### Cloud (SQL editor)

If tables are missing (`relation "hub_members" does not exist`, `Could not find the table 'public.hubs'`), the core schema was never applied — or you only ran the small Phase 2 policy file. Run these **in order**, each as a **new** SQL Editor query (paste full file contents):

1. [`supabase/00_reset_nexus.sql`](supabase/00_reset_nexus.sql) — safe wipe of Nexus tables only (skip if project is empty)  
2. [`supabase/migrations/20260715000000_nexus_core.sql`](supabase/migrations/20260715000000_nexus_core.sql) — **creates** `hubs`, `hub_members`, `messages`, …  
3. [`supabase/seed.sql`](supabase/seed.sql) — games/hubs/channels  

Then check **Table Editor → hubs** and **games**. You should see Fortnite, Valorant, etc.

Do **not** run `20260715010000_phase2_*.sql` first — that policy needs `hub_members` already. It is already included inside the core migration; only run the Phase 2 file if you applied an older core without that policy.

Do **not** run seed before the migration succeeds. To redo from scratch: reset → core → seed.

### `hub_members_user_id_fkey` / 409 on join

`00_reset_nexus.sql` drops `profiles` but **keeps** `auth.users`. Joining a hub then fails because `user_id` has no profile row.

**Fix now:** run [`supabase/01_backfill_profiles.sql`](supabase/01_backfill_profiles.sql) in the SQL Editor (creates missing profiles + insert policy). Soft-refresh the app and try again.

The app also auto-creates a profile on login when the insert policy exists (`20260715020000_ensure_profile.sql`).

### Local CLI

```bash
npx supabase start
npx supabase db reset   # applies migrations + seed
```

## 4. Verify auth

1. `npm run dev`
2. Open `/register`, create a user
3. Confirm a row appears in `public.profiles` and `public.user_prefs` (trigger `handle_new_user`)
4. `/login` with the same credentials

Without env keys, login/register still work in **demo/mock mode** and show a banner.

## 5. Mock vs live data

| Env | Behavior |
|---|---|
| No Supabase keys | Full mock UI |
| Keys set (default) | Live hubs, chat, friends, DMs, Realtime |
| Keys set + `VITE_USE_MOCK=1` | Real auth possible; social/chat still mock |

**Live chat:** apply schema + seed, set keys, sign in, open `/`. Selecting a hub auto-joins; composer inserts into `messages`.

Pin: RLS lets authors update their own messages (pin/unpin). Hub-wide pin for mods can land later.

Server stubs under [`src/server/`](src/server/) remain for privileged paths: hubs, messages, friends, dms, notifications.

## 6. Launch phases

| Phase | Focus | Exit |
|---|---|---|
| **0** Foundation (done) | Schema, clients, auth UI, stubs, voice stub | Build green; auth works with keys |
| **1** Auth + profiles (done) | `/me`, prefs in DB, username uniqueness, reset password | Register → edit profile persists |
| **2** Hubs + text Realtime (done) | Home chat + Realtime + Discover join | Two browsers sync messages |
| **3** Friends + DMs (done) | Requests, accept RPC, DM threads + Realtime | Request → accept → DM sync |
| **4** Notifications (done) | Triggers + Realtime inbox | Mentions / friends / DMs alert live |
| **5** Voice (LiveKit) (done) | Token mint + LiveKit client | Two users in Lobby Alpha |
| **6** Launch hardening (done) | Legal, reports/block, PWA, headers | See [LAUNCH.md](LAUNCH.md) |

## File map

```
supabase/
  config.toml
  migrations/20260715000000_nexus_core.sql
  seed.sql
src/lib/supabase/
  client.ts   browser
  server.ts   service role / JWT
  auth.ts     sign-in/up/out helpers
  types.ts    Database types
  dto.ts      UI-shaped DTOs
  env.ts      env flags
src/lib/auth-provider.tsx
src/lib/chat/api.ts          hub/channel/message client API
src/hooks/use-hub-chat.ts    live hub chat + Realtime
src/lib/social/api.ts        friends + DMs client API
src/hooks/use-friends.ts     friends list / requests
src/hooks/use-dms.ts         DM threads + Realtime
src/lib/notifications/api.ts notification fetch / mark-read
src/lib/notifications-provider.tsx  inbox + Realtime + toast
src/lib/voice/               VoiceClient + createVoiceToken RPC
src/server/                  createServerFn APIs
.env.example
```

### Phase 5 — LiveKit voice

1. Create a project at [cloud.livekit.io](https://cloud.livekit.io) (or self-host).
2. Copy **URL** (`wss://…`), **API Key**, **API Secret** into `.env` / Lovable env:

```bash
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
VITE_USE_MOCK=0
```

3. Restart the dev server. Open a hub → voice node (e.g. Lobby Alpha) on two signed-in accounts.
4. Server mints a token via `createVoiceToken` only after hub membership is verified.
5. Missing LiveKit env → join still opens VoiceDock in stub mode (no WebRTC).

### Phase 3 SQL (cloud)

After core schema + seed (+ profile backfill if needed), run in the SQL Editor:

[`supabase/02_phase3_friends_dms.sql`](supabase/02_phase3_friends_dms.sql)

(or `migrations/20260715030000_phase3_friends_dms.sql` — same contents)

Creates RPCs: `accept_friend_request`, `decline_friend_request`, `remove_friend`, `get_or_create_dm_thread`.

### Phase 4 SQL (cloud)

Run [`supabase/03_phase4_notifications.sql`](supabase/03_phase4_notifications.sql) after Phase 3.

Creates `notify_user` + triggers for friend requests/accepts, DM messages, and channel `@mentions`. Inbox lives at `/notifications` with Realtime + dock badge.

### Phase 6 SQL (cloud)

Run [`supabase/04_phase6_launch.sql`](supabase/04_phase6_launch.sql):

- `reports` table (message/user reports)
- `profiles.banned_at` / `ban_reason` (banned users are signed out on load)

Legal pages: `/terms`, `/privacy`, `/cookies`. PWA: `public/sw.js` + `/icons/*`. Checklist: [LAUNCH.md](LAUNCH.md).

### Mentions (`@user#tag`)

Run [`supabase/06_mention_tag.sql`](supabase/06_mention_tag.sql) so channel @mentions only notify on exact `Username#1234` (composer inserts that format from the roster picker).

### Storage (avatars + attachments)

Run [`supabase/07_storage.sql`](supabase/07_storage.sql):

- Public buckets `avatars` and `attachments` (user folder = auth uid)
- `messages` / `dm_messages` attachment columns

Upload from `/me` (avatar) and the hub composer (files/images).

### OAuth (Google + Discord)

1. Supabase Dashboard → Authentication → Providers → enable Google and/or Discord  
2. Set redirect URL to your site origin (e.g. `http://localhost:8080/**` and production `SITE_URL`)  
3. Login buttons call `signInWithOAuth` — Steam remains “coming soon”

### Admin console (god-mode)

1. Set server env `ADMIN_USER_IDS=<your-auth-user-uuid>` (comma-separated, never `VITE_`)  
2. Run [`supabase/08_admin_ops.sql`](supabase/08_admin_ops.sql) (`games`/`hubs.image_url`, `hub-media` bucket, service_role hub role bypass)  
3. Open `/admin` while signed in as that user  
4. Tabs: **Hubs / Games / Channels / Users / Reports** — create/edit/delete catalog + text/voice channels, upload images, ban users, triage reports  
5. In hub chat, admins can delete/pin any message and kick/set roles from the roster  

**Hub creation is admin-only.** Authenticated clients have select-only RLS on `hubs` (no insert). Discover’s “Create a hub” opens `/admin` for allowlisted admins and denies everyone else.

### DM voice

With LiveKit configured, the Phone button on a DM joins room `nexus-dm-{threadId}` after participant check. Video stays deferred.

### Phase 7 — Security hardening (required before public launch)

Run [`supabase/05_security_hardening.sql`](supabase/05_security_hardening.sql) after phases 3–6:

- Revoke client `execute` on `notify_user`
- Drop DM participant self-insert; DM create requires friendship + no blocks
- Freeze `banned_at` / `ban_reason` from client updates
- Freeze hub `role` on membership updates (no self-admin)
- Friendships writable only via SECURITY DEFINER RPCs
- Friend-request accept only by recipient; decline deletes row (re-request OK)
- Ban gates on messages / DMs / hub join / reports

## Security notes

- Never commit `.env` or the service role key
- RLS is enabled on all public tables — verify policies before launch
- Prefer server functions for privileged writes; browser client for session + Realtime
- After Phase 7 SQL, LiveKit tokens always require a real `voice_channels` UUID + hub membership
