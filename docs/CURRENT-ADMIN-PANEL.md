# Current Admin Panel — As-Built Documentation

**Product:** Nexus (Game Hub Connect)  
**Document date:** 2026-07-17  
**Scope:** Document only — no redesign, no code changes in this pass  
**Audience:** Product Designer + Technical Architect  
**Authority for auth model:** [`docs/ADMIN-SECURITY.md`](./ADMIN-SECURITY.md)

---

## 1. Overall Architecture

### Purpose

The Admin Panel is a **platform operations console** for trusted operators to:

- Manage the **games catalog** and **community hubs** (create/edit/delete, artwork, MENA channel seeding)
- Manage **text and voice channels** per hub
- Manage **platform admins**, **bans**, and **user lookup**
- Process a lightweight **reports / moderation queue**
- Glance at **Supabase + LiveKit health** chips

It is **not** a full SaaS control plane (no analytics product, no audit UI, no feature flags, no jobs UI, no media library browser, no LiveKit room ops).

### Who can access it

| Actor | Access |
|-------|--------|
| Anonymous / signed-out | Denied (no JWT) |
| Signed-in member (no platform role) | Denied |
| User with `platform_roles.role = platform_admin` | Allowed |
| User UUID listed in server-only `ADMIN_USER_IDS` | Allowed; **bootstraps** a `platform_roles` row on first gate |

Hub roles (`hub_members`: admin / mod / member) do **not** grant `/admin` access.

### Permissions model

- **Single platform role:** `platform_admin` only (by design — Phase 3).
- **All mutating admin APIs** call `requireAdmin(accessToken)` then use the **Supabase service role** (`getSupabaseAdminClient()`), bypassing RLS intentionally.
- **Audit:** mutations append to `admin_audit_log` via `writeAdminAudit` (soft-fail; never blocks the mutation).
- **No permission matrix UI**, no scoped admin roles (e.g. “moderation-only”), no JWT-side “god mode” on tables.

### Authentication & authorization flow

```
Browser → /admin
  → useAuth: user + accessToken
  → checkIsAdmin({ accessToken })  // createServerFn
      → requireAdmin(accessToken)
          1. Validate JWT (Supabase getUser)
          2. SELECT platform_roles WHERE user_id AND role=platform_admin
          3. Else if userId ∈ ADMIN_USER_IDS → upsert platform_roles + audit bootstrap
          4. Else FORBIDDEN
  → UI: denied | checking | full console
```

Client UX also uses `useIsAdmin()` elsewhere (Discover “start hub”, Settings account card, chat pin/delete/kick overrides). Same server gate.

### Route structure

| Path | File | Notes |
|------|------|-------|
| `/admin` | `src/routes/admin.tsx` | **Only** admin route. `noindex`. ~1,478 lines — entire UI in one file. |

**No nested routes** (`/admin/users`, `/admin/reports`, etc.). Tabs are React `useState`, not URL segments — **not deep-linkable**.

### Navigation structure

**In-app entry:**

1. **Settings → Account** — admin-only card linking to `/admin` (if `checkIsAdmin`)
2. **Discover** — “Start your own” / create hub path: admins → `/admin`; non-admins → toast denied

**Inside `/admin`:**

Horizontal pill tabs (client state):

1. Hubs  
2. Games  
3. Channels  
4. Users  
5. Reports  

### Layout hierarchy

```
AppShell                    ← same consumer shell (bottom dock, voice bar, etc.)
└─ main.max-w-4xl
   ├─ header (Shield + “Admin console” + DB/LiveKit chips)
   ├─ tab strip (overflow-x pills)
   └─ scroll body
      └─ HubsTab | GamesTab | ChannelsTab | UsersTab | ReportsTab
         └─ local Panel / Field helpers (not shared design-system admin primitives)
```

There is **no** `src/components/admin/**` package. Admin chrome shares the consumer `AppShell` (bottom nav still visible).

---

## 2. Complete Navigation Map

```
/admin                          [single page]
│
├─ [Gate] Checking…
├─ [Gate] Access denied
│
└─ [Allowed] Admin console
   │
   ├─ Header health chips (always when allowed)
   │    ├─ DB · N games | DB · down
   │    └─ LiveKit · stub | unreachable | {host}
   │
   ├─ Tab: Hubs (default)
   │    ├─ Create / Edit form
   │    └─ Hubs list → Edit | Pic | Delete
   │
   ├─ Tab: Games
   │    ├─ Create / Edit form + 4 artwork slots
   │    └─ Games list → Edit | Delete
   │
   ├─ Tab: Channels
   │    ├─ Hub selector
   │    ├─ Text channels → Apply MENA template | Add | Delete
   │    └─ Voice channels → Add | Delete
   │
   ├─ Tab: Users
   │    ├─ Platform admins list → Revoke
   │    ├─ Look up user (Username#1234) → Ban | Unban | Grant/Revoke admin
   │    └─ Banned list → Unban
   │
   └─ Tab: Reports
        ├─ Status filters: open | reviewing | resolved | dismissed | all
        └─ Report card → templates | note | reviewing | resolve | dismiss | ban target

Related (NOT under /admin, but admin-powered):
├─ /c/$hubSlug/t/$channelSlug   → platform admin kick / pin / soft-delete via admin APIs
├─ /settings                    → link into /admin
└─ /discover                    → admin shortcut to /admin for hub creation
```

There is **no** Dashboard, Analytics, Settings (admin), System Ops, Voice Ops, Media Manager, or Audit Log page.

---

## 3. Every Existing Section

> Pattern for each: Purpose · UI · Functionality · Actions · Missing · Limits · Routes · Components · Hooks · API · Tables · Server fns

### 3.1 Access gate

| | |
|--|--|
| **Purpose** | Block non-admins |
| **UI** | Centered stone text: denied / checking |
| **Actions** | None |
| **Missing** | Polished empty/denied screen, CTA to Settings/login, non-technical copy |
| **Route** | `/admin` |
| **Components** | Inline in `AdminPage` |
| **API** | `checkIsAdmin` |

### 3.2 Header + health

| | |
|--|--|
| **Purpose** | Minimal ops glance |
| **UI** | Two uppercase chips: Database (games count), LiveKit |
| **Actions** | Read-only |
| **Missing** | Charts, incidents, historical uptime, queue depth, storage usage |
| **API** | `getAppHealth` → `collectAppHealth` (`src/lib/ops/health.ts`) |
| **Tables** | Head-count on `games` |
| **Limit** | `getAppHealth` server fn itself is **not** `requireAdmin`-gated (only called after client allow) |

### 3.3 Hubs tab

| | |
|--|--|
| **Purpose** | Community hub CRUD + image + optional MENA seed on create |
| **UI** | Form panel + list panel |
| **Actions** | Create, edit, delete, upload image (form or per-row “Pic”), toggle MENA template on create, set region |
| **Missing** | Ownership transfer UI, invite codes, visibility flags, discovery ranking, soft-delete, bulk ops, hub member browser |
| **Route** | `/admin` tab `hubs` |
| **Components** | `HubsTab`, `Panel`, `Field` in `admin.tsx` |
| **API** | `adminListHubs`, `adminListGames`, `adminUpsertHub`, `adminDeleteHub`, `adminUploadHubMedia` |
| **Tables** | `hubs`, `games`, `hub_members` (founder admin on create), `text_channels`/`voice_channels` via seed, storage `hub-media` |

### 3.4 Games tab

| | |
|--|--|
| **Purpose** | Games catalog + artwork slots |
| **UI** | Form with id/name/short/category + cover/banner/icon/background cards; list with art summary |
| **Actions** | Upsert, delete, upload per slot, clear URL, edit from list |
| **Missing** | Featured/hidden toggles, sort order UI, tint editors in UI (fields exist in form defaults but not exposed as pickers), discovery weight |
| **API** | `adminListGames`, `adminUpsertGame`, `adminDeleteGame`, `adminUploadHubMedia` |
| **Tables** | `games`; storage `hub-media` |

### 3.5 Channels tab

| | |
|--|--|
| **Purpose** | Per-hub text/voice channel create/delete + MENA template |
| **UI** | Hub `<select>`; two panels |
| **Actions** | Apply MENA template; add text (name+topic); add voice (name); delete |
| **Missing** | Edit name/topic/slug/position; capacity editor; LiveKit room name editor; reorder; archive |
| **API** | `adminListHubs`, `adminListChannels`, `adminApplyMenaChannelTemplate`, `adminUpsertTextChannel`, `adminUpsertVoiceChannel`, `adminDeleteTextChannel`, `adminDeleteVoiceChannel` |
| **Tables** | `text_channels`, `voice_channels` |
| **Note** | API supports update-by-id; **UI only creates/deletes** |

### 3.6 Users tab

| | |
|--|--|
| **Purpose** | Platform admin roster + lookup + bans |
| **UI** | Three panels |
| **Actions** | List/revoke admins; lookup `Username#1234`; ban/unban with reason; grant/revoke platform admin; list banned |
| **Missing** | Full user directory, filters, suspend (vs ban), verification, appeals, activity timeline, audit history viewer, bulk ban |
| **API** | `adminListPlatformAdmins`, `adminGrantPlatformRole`, `adminRevokePlatformRole`, `adminLookupUser`, `adminBanUser`, `adminListBanned` |
| **Tables** | `platform_roles`, `profiles` |

### 3.7 Reports tab

| | |
|--|--|
| **Purpose** | Moderation queue |
| **UI** | Filter chips + report cards with Arabic assist chips + response templates |
| **Actions** | Filter; set reviewing/resolved/dismissed; resolution note; ban reported target |
| **Missing** | Message preview viewer, DM/media preview, appeals, assign reviewer, SLA timers, escalate, bulk resolve |
| **API** | `adminListReports`, `adminSetReportStatus`, `adminBanUser` |
| **Libs** | `scanArabicAssistSignals`, `MOD_RESPONSE_TEMPLATES` (`src/lib/moderation/arabic-assist`) |
| **Tables** | `reports` (+ joined `profiles`) |

### 3.8 Out-of-panel admin APIs (no `/admin` UI)

| API | Used where | UI in Admin Panel? |
|-----|------------|--------------------|
| `adminKickFromHub` | Community chat | No |
| `adminDeleteMessage` | `use-hub-chat` | No |
| `adminPinMessage` | `use-hub-chat` | No |
| `adminSetHubRole` | **Nowhere** | No — dead export |

---

## 4. Dashboard

**There is no Dashboard page.**

Closest equivalent: header health chips.

| Expected SaaS dashboard item | Present? |
|------------------------------|----------|
| Metrics (DAU, messages, voice minutes) | No |
| Charts | No |
| KPI cards | No |
| Activity feed | No |
| Recent events | No |
| Quick actions | No (tabs only) |
| Health indicators | **Yes** — DB games count + LiveKit reachability |

**Limitations:** Not a dashboard; no trends; LiveKit probe is HTTP GET `/` only (not TURN/ICE/room occupancy).

---

## 5. User Management

### What exists today

| Capability | Status |
|------------|--------|
| Search | Lookup by exact `Username#1234` only (`username_search_norm` + tag) |
| Filters | Banned list only (no status/region/date filters) |
| Sorting | None |
| Editing profile fields | No |
| Ban | Yes (`profiles.banned_at`, `ban_reason`); cannot ban self |
| Unban | Yes |
| Suspend (time-boxed) | No |
| Roles (platform) | Grant/revoke `platform_admin` |
| Roles (hub) | API `adminSetHubRole` exists; **no admin UI** |
| Verification | No |
| Reports (user-centric) | Indirect via Reports tab |
| Appeals | No |
| Activity | No |
| Audit history viewer | Writes exist; **no UI** |
| Directory / pagination | Banned capped ~100; no full user list |

### UX shape

1. Platform admins panel (list + revoke)  
2. Look up user → card with Ban / Unban / Grant / Revoke  
3. Banned list → Unban  

---

## 6. Community Management (Hubs)

### Supported

| Capability | Status |
|------------|--------|
| Create community | Yes — name, slug (optional→game id), game, region, image URL/upload |
| Edit | Yes |
| Delete | Yes (confirm dialog) |
| Ownership | Creator becomes `hub_members.role = admin`; **no transfer UI** |
| Roles | Not in Admin UI (`adminSetHubRole` unused) |
| Moderation tools for hub | Kick via chat for platform admin; not hub roster UI |
| Categories | Via linked **game** category, not hub category field |
| Artwork | Single hub `image_url` (+ upload to `hub-media`) |
| Invites | No admin invite manager |
| Discovery | Region + `has_lfg` affected indirectly by templates; no “featured hub” toggle |
| Visibility | No private/unlisted flag in admin UI |
| MENA seed on create | Checkbox → Arabic text/voice channel template |

### MENA seed (create)

Uses `MENA_HUB_TEXT_TEMPLATE` / `MENA_HUB_VOICE_TEMPLATE` in `src/lib/hub-templates.ts` (Arabic display names, Latin slugs; voice capacities 8/5/5).

---

## 7. Game Management

### Supported

| Capability | Status |
|------------|--------|
| Create / upsert game | Yes — manual `id` (slug), name, short, category |
| Categories | Enum in UI: shooter, moba, sandbox, battle-royale, sports |
| Artwork | Cover, banner, icon, background — URL and/or upload |
| Icons / banners | Yes |
| Ordering | No admin sort/position field |
| Discovery / featured / hidden | No toggles |
| Tint / text_tint | Stored on save from form state; **no color pickers** in UI (defaults applied) |
| Delete | Yes |

Upload requires game `id` already set (`admin.games.needId`).

---

## 8. Content Moderation

### Reports queue (`/admin` → Reports)

| Item | Detail |
|------|--------|
| Sources | User-submitted `reports` (message / DM / voice channel ids shown truncated) |
| Workflow | open → reviewing → resolved / dismissed |
| Assist | Keyword/signal chips via `scanArabicAssistSignals` |
| Templates | `MOD_RESPONSE_TEMPLATES` (EN/AR) into resolution note |
| Actions | Status change, note (≤500), ban target |
| Media review | No in-panel media viewer |
| Message open-in-context | No deep link button |
| Appeals | Not implemented |
| Assign / claim | No |

### Outside Reports tab

- Platform admins can soft-delete / pin messages and kick from hub **inside chat UI**, not in Admin Panel.

---

## 9. Voice Management

### In Admin Panel

| Item | Status |
|------|--------|
| Voice room CRUD | Create/delete channel rows only |
| Capacity | Set by MENA template on seed; **no capacity editor in Channels UI** (API may accept capacity on upsert — UI does not expose it) |
| Permissions | None (future: `permissions-ext.ts` is product stub, not admin) |
| LiveKit ops | Header chip only |
| Monitoring / sessions / participants | No |
| Room name | Auto `nexus-{id}` or MENA `nexus-hub-{hubId}-{slug}` |

### Documented deferred (`docs/VOICE.md`)

Full SFU ops dashboard, TURN/ICE synthetics — not built.

---

## 10. Analytics

| Item | Status |
|------|--------|
| Current metrics | Games count in health chip only |
| Charts / dashboards | None |
| Data sources for analytics product | N/A |
| Missing | DAU/MAU, retention, messages/day, voice minutes, report volume, hub growth, funnel |

---

## 11. Settings (Admin)

**There is no Admin Settings section.**

Consumer Settings (`/settings`) is separate (language, region, account). Admin-relevant config is **environment / SQL**:

| Area | How configured today |
|------|----------------------|
| Application | Env / deploy |
| Communities | Via Hubs/Games/Channels tabs |
| Authentication | Supabase Auth (not admin UI) |
| Storage | `hub-media` bucket policies (migrations) |
| Notifications | Not admin-configurable |
| Security | `ADMIN_USER_IDS`, `platform_roles`, service role |
| Appearance | Not admin-configurable |
| Localization | App i18n; admin chrome partly EN-hardcoded (labels/toasts) |

---

## 12. System Operations

| Area | Present? |
|------|----------|
| Logs viewer | No |
| Jobs / queues | No |
| Errors / Sentry-style UI | No |
| Background tasks UI | No |
| Storage browser | No (upload only) |
| Database console | No |
| Health | Header chips + `GET /api/health` (ops) |
| Monitoring history | No |

Audit **writes** to `admin_audit_log` but there is **no audit reader UI** (RLS allows platform admins to SELECT; product never surfaces it).

---

## 13. Admin Roles

### Current

| Role | Scope |
|------|-------|
| `platform_admin` | Full access to all admin server fns |

### Bootstrap

`ADMIN_USER_IDS` CSV of UUIDs → upsert into `platform_roles` on first successful gate.

### Safeguards

- Cannot ban yourself  
- Cannot revoke the **last** platform admin if that row is yourself  
- Cannot grant platform admin to a banned user  

### Future limitations (intentional today)

- No moderation-only / content-only / read-only admin roles  
- No hub-scoped platform permissions  
- Hub permission matrix is product Phase 4 (`docs/HUB-PERMISSIONS.md`), not this console  

---

## 14. Database Mapping

### Core tables

| Table | Admin usage |
|-------|-------------|
| `platform_roles` | Grant/revoke/list; bootstrap |
| `admin_audit_log` | Append on mutations; **no UI read** |
| `profiles` | Lookup, ban fields, joins on reports/admins |
| `games` | CRUD + artwork URLs |
| `hubs` | CRUD + region/image |
| `hub_members` | Founder admin on hub create; kick/set_role APIs |
| `text_channels` | List/create/delete (+ template) |
| `voice_channels` | List/create/delete (+ template, `livekit_room_name`, capacity on seed) |
| `reports` | List/update status/note |
| `messages` | Soft-delete / pin via admin APIs (chat UI) |
| Storage `hub-media` | Uploads |

### Views / RPCs / Edge / Realtime

| Mechanism | Admin Panel |
|-----------|-------------|
| Views | None dedicated |
| RPCs | `is_platform_admin(uuid)` exists for RLS; admin API does not call custom RPC for CRUD |
| Edge Functions | Not used by admin API |
| Realtime | Not used in admin UI (manual refresh) |

### Migrations of note

- `supabase/migrations/20260715100000_admin_ops.sql` — media / ops  
- `supabase/migrations/20260715130000_phase3_platform_roles.sql` — roles + audit  
- Manual twin: `supabase/manual/08_admin_ops.sql`  

### Audit actions written (non-exhaustive)

`user.ban` / `user.unban`, `game.upsert` / `game.delete`, `hub.create` / `hub.update` / `hub.delete`, `hub.apply_mena_channel_template`, `text_channel.*`, `voice_channel.*`, `media.upload`, `hub_member.set_role`, `hub_member.kick`, `report.set_status`, `message.soft_delete` / `message.pin` / `message.unpin`, `platform_role.grant` / `platform_role.revoke`, `platform_role.bootstrap`

---

## 15. UX Review (objective, no redesign)

### What feels confusing

- Admin lives inside the **consumer AppShell** (bottom dock still present) — unclear if this is “ops console” or “power user screen”
- Access denied copy exposes **env var names and doc paths** to end users  
- Tabs are not in the URL — refresh loses tab; cannot share “Reports” link  
- Channels tab English hardcoding (“Text channels”, “Add text”) mixed with i18n elsewhere  

### What feels unfinished

- No dashboard landing — opens on Hubs form  
- Channel edit/reorder/capacity missing despite API support  
- `adminSetHubRole` API with zero UI  
- Audit log write-only from product POV  
- Tint fields not editable as colors  

### What feels duplicated

- Hub image upload vs game artwork upload (same storage helper, similar patterns duplicated in-file)  
- Ban available from Users lookup **and** Reports card  

### What feels inconsistent

- Some panels fully i18n’d; others (“Look up user”, “Banned”, toasts like “Hub deleted”) still English  
- Games use rich artwork cards; Hubs use a single image URL field  
- Confirm dialogs mixed: i18n keys vs raw browser `confirm`  

### What feels like a developer tool

- Mono UUIDs shown prominently  
- Health chips as tiny uppercase ops text  
- Denied screen instructing operators to set `ADMIN_USER_IDS`  
- Entire console as one monolithic route file with local `Panel`/`Field`  
- Forms look like internal CRUD, not a curated admin product  

---

## 16. Missing Features

Compared with a production-grade SaaS admin panel, **missing or incomplete**:

| Area | Gap |
|------|-----|
| Dashboard | KPIs, trends, alerts |
| Audit Logs UI | Table exists; no viewer/export |
| Role Management | Only one role; no matrix |
| Permission Matrix | Deferred |
| Bulk Actions | None |
| Advanced Search | Users: exact tag only |
| Exports | CSV/JSON none |
| Activity Timeline | None |
| Moderation Queue (full) | Basic reports only |
| Appeals | None |
| System Health | Chips only |
| Notifications (admin) | None |
| Feature Flags | None |
| Media Manager | Upload-only, no browse/delete library |
| Background Jobs | None |
| API Keys management | None |
| Rate Limits UI | Server rate limits exist elsewhere; not admin-managed |
| Security Center | None |
| Voice / LiveKit ops | Deferred |
| Nested IA / deep links | Single route |
| Impersonation | None |
| Soft-delete / restore | Hard deletes for hubs/games/channels |
| Pagination | Lists unbounded or soft-capped |
| Webhooks / integrations | None |

---

## 17. Technical Debt

| Debt | Detail |
|------|--------|
| Monolith UI | All tabs in `src/routes/admin.tsx` (~1.5k lines) |
| No admin component library | Local `Panel`/`Field` only |
| Duplicated form/upload patterns | Hubs vs Games |
| Dead API | `adminSetHubRole` unused |
| Ungated health fn | `getAppHealth` not `requireAdmin` |
| Mixed i18n | Hardcoded EN strings/toasts |
| Client tab state | Not URL-synced |
| Service-role god mode | Intentional for now; broad blast radius if gate fails |
| Soft-fail audit | Failed audit inserts only `console.warn` |
| Channel UI/API mismatch | Upsert supports update; UI never passes `id` for edit |
| Mock mode | Does **not** unlock admin; still needs real JWT + role |
| Performance | Full list loads; no virtualization/pagination |
| Scalability | Fine for early ops; not for large catalogs/report volumes |

---

## 18. Screenshots

**Directory:** [`docs/ui-walkthrough/admin/`](./ui-walkthrough/admin/)

| File | Viewport | Content |
|------|----------|---------|
| `01-denied-desktop.png` | Wide | Access denied |
| `01-denied-tablet.png` | ~768 | Access denied |
| `01-denied-mobile.png` | ~390 | Access denied |

### Screenshot limitation (honest)

This documentation pass ran against a **local mock** session **without** a platform-admin JWT. Therefore:

- **Authenticated tabs (Hubs / Games / Channels / Users / Reports) were not capturable** without logging in as an `ADMIN_USER_IDS` / `platform_roles` user against live Supabase.
- Captures show the **real access gate** (denied) across desktop/tablet/mobile, which is itself part of the current product.

**To complete visual coverage later:** sign in as a platform admin on staging/production (or local with mock off + valid admin UUID), open `/admin`, and capture each tab at desktop + tablet (+ mobile if still using AppShell).

### Structural UI summary (from code, for designers)

When allowed, expect:

1. **Header** — “Admin console” + DB/LiveKit chips  
2. **Five pills** — Hubs, Games, Channels, Users, Reports  
3. **Stacked `Panel` cards** — uppercase stone titles, bordered forms/lists, accent primary buttons, danger deletes  
4. **Max width ~4xl**, still wrapped in consumer bottom navigation  

---

## 19. Final Summary — Product Lead Assessment

### What is good?

- **Clear security boundary** documented and enforced server-side (`requireAdmin` + durable `platform_roles` + break-glass env).  
- **Enough CRUD** to bootstrap a MENA gaming catalog: games, hubs, channels, bans, reports.  
- **Arabic moderation assist** on reports is a real product differentiator vs a generic CRUD admin.  
- **Audit trail writes** show intent toward accountability.  
- Mutations centralized in `src/lib/admin/api.ts` — discoverable for architects.

### What is average?

- Functional **internal ops forms** that get the job done for a small operator team.  
- Health chips are a minimal but useful “is the backend up?” signal.  
- MENA templates accelerate hub setup.

### What is poor?

- Feels like a **developer console bolted into the consumer app**, not a professional admin product.  
- **No information architecture** beyond five tabs on one URL.  
- Denied/empty states and mixed language quality undermine trust.  
- Critical capabilities (audit viewer, hub roles UI, channel editing, voice ops) are missing or half-wired.

### What is missing?

Everything expected of a production SaaS admin: dashboard, analytics, audit UI, roles matrix, bulk tools, media library, jobs, security center, deep-linked sections, and true voice/system monitoring.

### What would prevent this admin panel from managing a large production platform?

1. **Single flat page + unbounded lists** — will not scale to thousands of hubs/users/reports.  
2. **One all-powerful role + service-role mutations** — operational risk and no least-privilege staffing.  
3. **No audit viewer / exports / appeals** — compliance and trust-and-safety process gaps.  
4. **No observability product** — cannot run growth or incident response from this UI.  
5. **Voice is catalog-only** — cannot manage live rooms at scale.  
6. **Consumer shell + non-shareable tabs** — poor ops workflow for multi-person teams.

**Bottom line:** The current Admin Panel is a **credible Phase-3 bootstrap ops tool** for early Nexus operators. It is **not** yet an admin system capable of running a large production platform without significant IA, RBAC, moderation, and observability investment.

---

## Appendix A — Key source files

| Path | Role |
|------|------|
| `src/routes/admin.tsx` | Entire Admin UI |
| `src/lib/admin/api.ts` | All admin `createServerFn`s |
| `src/lib/admin/authz.ts` | `requireAdmin`, `writeAdminAudit`, `parseAdminIds` |
| `src/hooks/use-is-admin.ts` | Client admin boolean |
| `src/lib/ops/health.ts` / `get-app-health.ts` | Health chips |
| `src/lib/hub-templates.ts` | MENA channel templates |
| `src/lib/moderation/arabic-assist.ts` | Reports assist + templates |
| `docs/ADMIN-SECURITY.md` | Auth authority |

## Appendix B — Exported admin API surface

`checkIsAdmin`, `adminBanUser`, `adminLookupUser`, `adminListBanned`, `adminListGames`, `adminUpsertGame`, `adminDeleteGame`, `adminListHubs`, `adminUpsertHub`, `adminDeleteHub`, `adminListChannels`, `adminApplyMenaChannelTemplate`, `adminUpsertTextChannel`, `adminDeleteTextChannel`, `adminUpsertVoiceChannel`, `adminDeleteVoiceChannel`, `adminUploadHubMedia`, `adminSetHubRole` *(unused UI)*, `adminKickFromHub`, `adminListReports`, `adminSetReportStatus`, `adminDeleteMessage`, `adminPinMessage`, `adminListPlatformAdmins`, `adminGrantPlatformRole`, `adminRevokePlatformRole`.

---

*End of as-built documentation. No redesign proposed in this document.*
