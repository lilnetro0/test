# Production Hardening Plan — Nexus / Game Hub Connect

**Status:** Hardening Phases 0–18 Done. Arabic-first **AF1–AF22 Done** (deferred Arabic-first backlog closed).
**Created:** 2026-07-15  
**Standing policy:** Arabic-first / MENA — see `docs/ARABIC-PRODUCT-GUIDELINES.md`. Future phases must include an **Arabic-first impact** section.  
**Rule:** Execute one phase at a time; stop and wait for approval before the next phase.

---

## Purpose

Track incremental production hardening across database safety, authorization, messaging reliability, trust & safety, mobile packaging, observability, tests, and App Store launch readiness — without rewriting the TanStack Start + Supabase + LiveKit + Capacitor stack.

**Arabic-first / MENA** is standing product policy. Phase **0** (repository audit) must evaluate Arabic-first UX, RTL, mixed-direction text, Arabic search, MENA moderation, regional discovery, and mobile performance — see [`ARABIC-FIRST-AUDIT.md`](ARABIC-FIRST-AUDIT.md). Implementation of those gaps is **not** part of Phase 0; open a numbered phase after approval.

---

## Phase status board

| Phase | Title | Status | Notes |
|------:|-------|--------|-------|
| 0 | Repository audit and baseline | **Done** (+ Arabic-first re-audit) | `ARCHITECTURE-AUDIT.md`, `FEATURE-READINESS-MATRIX.md`, **`ARABIC-FIRST-AUDIT.md`** |
| 1 | Database migration safety and environments | **Done** | See Phase 1 summary + `DATABASE-OPERATIONS.md` |
| 2 | Domain model clarification (games vs hub) | **Done** | See Phase 2 summary + `DOMAIN-MODEL.md` |
| 3 | Platform roles and admin security | **Done** | See Phase 3 summary + `ADMIN-SECURITY.md` |
| 4 | Hub roles and channel permissions | **Done** | See Phase 4 summary + `HUB-PERMISSIONS.md` |
| 5 | Message data model and chat reliability | **Done** | See Phase 5 summary + `MESSAGES.md` |
| 6 | Read state, unread counts, presence | **Done** | See Phase 6 summary + `PRESENCE-AND-READ-STATE.md` |
| 7 | Rate limiting and abuse prevention | **Done** | See Phase 7 summary + `RATE-LIMITS.md` |
| 8 | Storage and attachment security | **Done** | See Phase 8 summary + `STORAGE-SECURITY.md` |
| 9 | Trust, safety, moderation | **Done** | See Phase 9 summary + `TRUST-SAFETY.md` |
| 10 | Account security and lifecycle | **Done** | See Phase 10 summary + `ACCOUNT-LIFECYCLE.md` |
| 11 | Push notifications | **Done** | See Phase 11 summary + `PUSH.md` |
| 12 | LiveKit and voice reliability | **Done** | See Phase 12 summary + `VOICE.md` (+ follow-up) |
| 13 | Arabic, RTL, accessibility | **Done** | See Phase 13 summary + `I18N-RTL.md` (+ follow-up) |
| 14 | Mobile navigation and design refinement | **Done** | See Phase 14 summary + `MOBILE.md` (+ follow-up) |
| 15 | Capacitor architecture improvement | **Done** | See Phase 15 summary + `CAPACITOR.md` (+ follow-up) |
| 16 | Observability and operations | **Done** | See Phase 16 summary + `OPS.md` (+ follow-up) |
| 17 | Testing and security verification | **Done** | See Phase 17 summary + `TESTING-SECURITY.md` (+ follow-up) |
| 18 | App Store and launch readiness | **Done** | See Phase 18 summary + `APP-STORE.md` (+ follow-up) |
| **AF1** | **Arabic-first UX foundations** | **Done** | Bidi UGC + rate-limit AR + message search aliases — [`ARABIC-FIRST-PHASE1.md`](ARABIC-FIRST-PHASE1.md) |
| **AF2** | **Regional discovery foundations** | **Done** | Prefs/hubs region + Discover filters + locale region hint — [`ARABIC-FIRST-PHASE2.md`](ARABIC-FIRST-PHASE2.md) |
| **AF3** | **Hub templates + MENA moderation assist** | **Done** | Channel templates, hub region editor, assist chips, appeals — [`ARABIC-FIRST-PHASE3.md`](ARABIC-FIRST-PHASE3.md) |
| **AF4** | **DB-normalized Arabic search** | **Done** | `body_search_norm` + fold FN + trigram — [`ARABIC-FIRST-PHASE4.md`](ARABIC-FIRST-PHASE4.md) |
| **AF5** | **Admin chrome i18n + bilingual titles** | **Done** | Admin shell + `meta.page.*` — [`ARABIC-FIRST-PHASE5.md`](ARABIC-FIRST-PHASE5.md) |
| **AF6** | **Discover LFG filter** | **Done** | `hubs.has_lfg` + Discover chip — [`ARABIC-FIRST-PHASE6.md`](ARABIC-FIRST-PHASE6.md) |
| **AF7** | **Games admin i18n + in-hub LFG + fonts** | **Done** | [`ARABIC-FIRST-PHASE7.md`](ARABIC-FIRST-PHASE7.md) |
| **AF8** | **Voice report + lang hydrate** | **Done** | [`ARABIC-FIRST-PHASE8.md`](ARABIC-FIRST-PHASE8.md) |
| **AF9** | **Admin confirm dialogs i18n** | **Done** | [`ARABIC-FIRST-PHASE9.md`](ARABIC-FIRST-PHASE9.md) |
| **AF10** | **reports.voice_channel_id** | **Done** | [`ARABIC-FIRST-PHASE10.md`](ARABIC-FIRST-PHASE10.md) |
| **AF11** | **In-hub LFG post helper** | **Done** | [`ARABIC-FIRST-PHASE11.md`](ARABIC-FIRST-PHASE11.md) |
| **AF12** | **Voice report participant picker** | **Done** | [`ARABIC-FIRST-PHASE12.md`](ARABIC-FIRST-PHASE12.md) |
| **AF13** | **Catalog name_search_norm** | **Done** | [`ARABIC-FIRST-PHASE13.md`](ARABIC-FIRST-PHASE13.md) |
| **AF14** | **ui/* logical CSS** | **Done** | [`ARABIC-FIRST-PHASE14.md`](ARABIC-FIRST-PHASE14.md) |
| **AF15** | **Profile search norms** | **Done** | [`ARABIC-FIRST-PHASE15.md`](ARABIC-FIRST-PHASE15.md) |
| **AF16** | **Cookie SSR lang/dir shell** | **Done** | [`ARABIC-FIRST-PHASE16.md`](ARABIC-FIRST-PHASE16.md) |
| **AF17** | **Route/shell logical CSS** | **Done** | [`ARABIC-FIRST-PHASE17.md`](ARABIC-FIRST-PHASE17.md) |
| **AF18** | **Self-hosted Noto Arabic** | **Done** | [`ARABIC-FIRST-PHASE18.md`](ARABIC-FIRST-PHASE18.md) |
| **AF19** | **Thin in-hub LFG board** | **Done** | [`ARABIC-FIRST-PHASE19.md`](ARABIC-FIRST-PHASE19.md) |
| **AF20** | **Self-hosted Latin fonts** | **Done** | [`ARABIC-FIRST-PHASE20.md`](ARABIC-FIRST-PHASE20.md) |
| **AF21** | **React SSR lang hydrate** | **Done** | [`ARABIC-FIRST-PHASE21.md`](ARABIC-FIRST-PHASE21.md) |
| **AF22** | **Physical CSS mop-up** | **Done** | [`ARABIC-FIRST-PHASE22.md`](ARABIC-FIRST-PHASE22.md) |

---

## Phase 0 summary (2026-07-15)

### Phase 0 scope (canonical audit checklist)

Phase 0 is the **repository audit and baseline**. It must cover:

1. **Architecture / stack** — TanStack Start, Supabase, LiveKit, Capacitor, deploy targets  
2. **Feature readiness** — matrix of UI / backend / DB / RLS / mobile / tests  
3. **Tooling baseline** — typecheck, lint, tests, production build  
4. **Ops / env risks** — migrations, secrets, mock mode, Cap remote shell  
5. **Arabic-first / MENA product fit** (required axes — see `ARABIC-FIRST-AUDIT.md`):  
   - Arabic-first UX (default language, auth, hardcoded EN)  
   - RTL (html dir, logical CSS, chrome mirroring)  
   - Mixed-direction (bidi) text on UGC  
   - Arabic search (normalize, aliases, DB recall)  
   - MENA moderation (reporter UX, admin bidi, AR assist, appeals)  
   - Regional discovery (country/region, hub templates, LFG)  
   - Mobile performance for AR/MENA (fonts, keyboard, mid-range)

**Phase 0 produces planning + audit artifacts only.** It does **not** implement product gaps for axes above. Later phases (or a new Arabic-first numbered phase) implement after approval.

### Decisions

- Hardening proceeds **incrementally** on the existing React / TanStack Start / Supabase / LiveKit / Capacitor architecture.
- Cap remote-shell (`CAPACITOR_SERVER_URL`) is the TestFlight model; Phase 15 documents dual-mode + fail-closed CI (`docs/CAPACITOR.md`). Local `www/` cannot run `createServerFn`.
- Admin authorization: DB `platform_roles` + env `ADMIN_USER_IDS` bootstrap (Phase 3).
- Manual cloud SQL scripts (`supabase/manual/01`–`08`) coexist with `supabase/migrations/`; Phase 1 reconciled them (canonical = migrations; verify via `verify_schema.sql`).
- No destructive `db reset` against production.
- **Arabic is primary product language** (standing policy). English is supported. Audit→incremental fixes; no mega-redesign in Phase 0.

### Risks identified

1. **Typecheck currently fails** (large volume of Supabase client `never` typing + router search-param typing). Production JS build still ran historically via Codemagic; TS gate is not CI-green. *(Later phases closed much of this — see Phase 17.)*
2. **No automated unit/integration/e2e suite** in repo (no `*.test.*` / `*.spec.*` found; no `test` script). *(Phase 17 added Vitest + smokes.)*
3. **LAUNCH.md is stale** relative to later work (claims Storage/admin deferred while `07`/`08` and admin console exist). *(Phase 18 rewrote launch docs.)*
4. **Destructive reset** (`00_reset_nexus.sql`) is easy to paste in SQL Editor — production footgun.
5. **Admin = env UUID list** only; no audit log, no granular platform roles. *(Phase 3 added DB roles + audit.)*
6. **Hub/mod permissions** are coarse (`admin|mod|member`) with many god-mode actions via service role.
7. **Remote WebView** App Store Guideline 4.2 risk until bundled Cap build.
8. **Mock mode** is easy to leave on accidentally if `VITE_USE_MOCK=1` or keys missing.
9. **Env validation** is soft (returns null / mock) rather than failing closed in production.
10. **Manual SQL apply order** on cloud is operator-dependent; “applied” state cannot be verified from this repo alone.
11. **Arabic-first product gaps** (re-audit): MENA regional discovery **Missing**; Arabic moderation assist **Missing**; search/bidi/RTL/admin chrome **Partial** — see ranked list in `ARABIC-FIRST-AUDIT.md`.

### Unresolved after Phase 0

- Exact schema state of each deployed Supabase project (dev/staging/prod).
- Whether Cloudflare Worker env / `SITE_URL` is live for every environment.
- Codemagic group `test` contents (must include `CAPACITOR_SERVER_URL`).
- Real-device verification matrix for latest safe-area/keyboard builds.
- Lint duration / full eslint report under Windows (run was slow/hung in audit environment — see baseline report).
- **Arabic-first backlog** (not implemented in Phase 0): regional discovery schema/filters, Arabic T&S assist + admin bidi/i18n, DB-normalized search, full UGC `dir="auto"`, region locale fallback, appeal UX, font subset / mid-range perf budget.

### Baseline command results (this machine — original Phase 0)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **FAIL** (exit 2). Dominant errors: Supabase `Database` types resolve many inserts/selects to `never`; TanStack Router requires full `search` on navigations to `/`. |
| `npx eslint src` | **FAIL** (exit 1): **224 problems** (207 errors / 17 warnings). Vast majority are `prettier/prettier` (auto-fixable). Full-repo `npm run lint` is slow. |
| Unit tests | **NONE** (no `test` script; no `*.test.*` / `*.spec.*` files). |
| `npm run build` | **PASS** (exit 0). Nitro Cloudflare artifact generated (`.output/`, wrangler config). |

*(Snapshot updated by Phases 17–18: `typecheck` / Vitest / `smoke:*` / build green relative to later work — see those summaries.)*

### Deliverables created

- `docs/PRODUCTION-HARDENING-PLAN.md` (this file)
- `docs/FEATURE-READINESS-MATRIX.md`
- `docs/ARCHITECTURE-AUDIT.md`

### Phase 0 Arabic-first re-audit (2026-07-15)

**Goal:** Fold Arabic-first policy into Phase 0 audit scope; measure current code; **do not implement** beyond documentation.

**Done**

1. Expanded Phase 0 checklist with seven Arabic/MENA axes (above).  
2. Full code audit → [`docs/ARABIC-FIRST-AUDIT.md`](ARABIC-FIRST-AUDIT.md).  
3. Matrix + architecture audit updated with Arabic-first rows/notes.  
4. Standing guidelines already in tree (`ARABIC-PRODUCT-GUIDELINES.md`, terminology, RTL checklist, MENA moderation).

**Axis verdicts (abbrev.)**

| Axis | Verdict |
|------|---------|
| Arabic-first UX | Partial |
| RTL | Partial |
| Mixed-direction text | Partial |
| Arabic search | Partial |
| MENA moderation | Partial (assist Missing) |
| Regional discovery | Missing |
| Mobile AR/MENA performance | Partial |

**Top unresolved (implementation backlog — await next-phase approval)**

1. Regional / MENA discovery (country filters, profile region, hub templates)  
2. Arabic moderation assist + admin bidi/i18n + appeals  
3. DB-normalized Arabic search recall  
4. Complete UGC bidi (`composer`, notifications, reports, admin)  
5. Remaining EN user-path leftovers + region locale fallback  

**Explicitly not done this pass:** UI/feature implementation for the backlog above.

### Arabic-first impact (Phase 0 re-audit)

- **Arabic UI:** No new chrome; documented Partial vs guidelines.  
- **RTL testing:** Checklist referenced; physical CSS debt listed.  
- **Mixed-direction:** Gaps named with file paths in audit.  
- **Arabic search:** Helpers present; DB index gap recorded.  
- **Moderation:** Reporter AR OK; MENA assist Missing.  
- **Unresolved:** Ranked backlog in `ARABIC-FIRST-AUDIT.md`.

---

## Phase 1 summary (2026-07-15)

### Goals

Database migration safety, SQL classification, destructive-reset guard, env categories, fail-closed production (no accidental mock).

### Done

1. **Canonical vs manual SQL** — `supabase/migrations/` is source of truth; legacy paste scripts live in `supabase/manual/`; READMEs under `supabase/`, `migrations/`, `manual/`, `dangerous/`.
2. **Destructive reset guarded** — `00_reset_nexus.sql` is a stub that raises; real wipe lives at `supabase/dangerous/00_reset_nexus.sql` with session `set_config('nexus.allow_destructive_reset', 'I_UNDERSTAND', true)`.
3. **Ops doc** — `docs/DATABASE-OPERATIONS.md` (apply order, environments, rollback, live inventory via `verify_schema.sql`).
4. **Env** — `.env.example` split into public / server / deployment / production checklist; `assertProductionClientEnv` + `shouldUseMockData` refuse missing keys and `VITE_USE_MOCK` in `import.meta.env.PROD`; `assertProductionServerEnv` fails closed on missing `SUPABASE_SERVICE_ROLE_KEY` when admin client is used; client assert wired in `__root.tsx`.
5. **Pointers updated** — `BACKEND.md`, `LAUNCH.md`, profile/chat error strings cite `manual/` + ops doc.

### Migrations

No new schema migration. Added `supabase/verify_schema.sql` (read-only audit). Existing migration set unchanged.

### Env deltas

- Documented only (no new required keys). Production must set `VITE_SUPABASE_*`, must **not** set `VITE_USE_MOCK`, and must set server-only `SUPABASE_SERVICE_ROLE_KEY` for admin/service paths.

### Tests

None added (repo still has no test runner). Manual checks: stub `00` raises; dangerous script blocked without gate; `verify_schema.sql` on each env; prod asserts via code paths.

### Unresolved after Phase 1

**None remaining from the Phase 1 backlog.** Operators must still **run** `verify_schema.sql` once per live Supabase project (credentials are outside the repo) — the inventory tool and process are in place.

### Changed files (Phase 1)

- `docs/DATABASE-OPERATIONS.md` (new)
- `docs/PRODUCTION-HARDENING-PLAN.md`
- `supabase/README.md`, `supabase/migrations/README.md`, `supabase/manual/README.md`, `supabase/dangerous/README.md`
- `supabase/dangerous/00_reset_nexus.sql` (new), `supabase/00_reset_nexus.sql` (stub)
- `supabase/manual/01`–`08_*.sql` (moved from `supabase/`)
- `supabase/verify_schema.sql` (new)
- `.env.example`, `BACKEND.md`, `LAUNCH.md`, `CONSULTANT-BRIEF.txt`
- `src/lib/supabase/env.ts`, `src/lib/supabase/server.ts`, `src/routes/__root.tsx`
- `src/lib/supabase/profile.ts`, `src/lib/chat/api.ts` (ops pointers)

---

## Phase 2 summary (2026-07-15)

### Goals

Clarify catalog `games` vs social `hubs`, image precedence, discover/join identity, and seed/mock parity.

### Done

1. **Domain doc** — `docs/DOMAIN-MODEL.md` (tables, cardinality, URL vs catalog id, images, admin defaults).
2. **Mapping** — `mapHubRowToLiveHub`: `Game.id` = hub slug; `Game.gameId` = `games.id`; `hubUuid` set; covers = hub then game image.
3. **Hero / Discover** — `HubHero` keyed by `catalogGameId()`; join remains by hub slug.
4. **DTOs / server** — `GameDto` gains `gameId`, `hubUuid`, `imageUrl`; `listHubs` aligned.
5. **Admin** — new hub slug defaults to `game_id` (not slugified name); toast when slug ≠ game id.
6. **Seed + migration** — official hubs for dota2/cod/elden/gta; mock Discover + `HUBS` stubs match; `20260715120000_phase2_catalog_hubs.sql` for existing DBs.

### Migrations

- `supabase/migrations/20260715120000_phase2_catalog_hubs.sql` (data catch-up, idempotent)

### Env deltas

None.

### Tests

None automated. Manual: discover join with `slug !== game_id`; hero uses game id; seed/verify for 12 hubs.

### Unresolved after Phase 2

**None remaining** from the Phase 2 backlog:

- Settings per-hub notifs load joined hubs live (keys = hub slug).
- Canonical UI type is `HubCard` (`Game` kept as deprecated alias).
- Multi-hub-per-game remains **allowed by product policy** (no `UNIQUE(game_id)`).

### Changed files (Phase 2)

- `docs/DOMAIN-MODEL.md` (new), `docs/PRODUCTION-HARDENING-PLAN.md`, `docs/ARCHITECTURE-AUDIT.md`
- `src/lib/mock-data.ts`, `src/lib/chat/api.ts`, `src/lib/supabase/dto.ts`, `src/server/hubs.ts`
- `src/routes/discover.tsx`, `src/routes/admin.tsx`, `src/components/hub-hero.tsx`, `src/lib/admin/api.ts`
- `supabase/seed.sql`, `supabase/migrations/20260715120000_phase2_catalog_hubs.sql`, `supabase/migrations/README.md`

### Phase 2 follow-up (unresolved closed)

- `src/routes/settings.tsx` — live joined hubs for per-hub notifs
- `HubCard` / `HubCardDto` rename (+ `Game` / `GameDto` aliases); consumers updated
- `docs/DOMAIN-MODEL.md` — multi-hub policy explicit; prefs keyed by slug

---

## Phase 3 summary (2026-07-15)

### Goals

Durable platform admin roles, auditability, env allowlist demoted to bootstrap/break-glass — without weakening RLS.

### Done

1. **Migration** `20260715130000_phase3_platform_roles.sql` — `platform_roles`, `admin_audit_log`, `is_platform_admin()`, RLS (own role read; audit read for platform admins; no client writes).
2. **`src/lib/admin/authz.ts`** — `requireAdmin` (DB **or** env), env bootstrap upsert + `platform_role.bootstrap` audit, soft-fail `writeAdminAudit`.
3. **Wired** mutating admin server fns to audit (ban, catalog/hub/channel CRUD, media, kick/role, reports, message delete/pin).
4. **Types / verify / docs** — Database types, `verify_schema.sql`, `.env.example`, `docs/ADMIN-SECURITY.md`.

### Migrations

- `supabase/migrations/20260715130000_phase3_platform_roles.sql`

### Env deltas

- `ADMIN_USER_IDS` semantics updated (bootstrap + break-glass); still optional once DB rows exist. Still **never** `VITE_*`.

### Tests

None automated. Manual: apply migration → set `ADMIN_USER_IDS` → open `/admin` once → confirm `platform_roles` + audit bootstrap row → ban/unban leaves audit.

### Unresolved after Phase 3

**None remaining** from the Phase 3 backlog:

- Grant/revoke UI shipped (`/admin` → Users → Platform admins + lookup actions).
- Service-role mutations + single `platform_admin` role documented as intentional (see `ADMIN-SECURITY.md`).
- Hub-level permission matrix remains **Phase 4** (out of scope here).

### Phase 3 follow-up (unresolved closed)

- `adminListPlatformAdmins` / `adminGrantPlatformRole` / `adminRevokePlatformRole`
- `src/routes/admin.tsx` Users tab platform-admin panel
- `docs/ADMIN-SECURITY.md` intentional non-goals

### Changed files (Phase 3)

- `supabase/migrations/20260715130000_phase3_platform_roles.sql`, `supabase/migrations/README.md`, `supabase/verify_schema.sql`
- `src/lib/admin/authz.ts` (new), `src/lib/admin/api.ts`, `src/lib/supabase/types.ts`
- `docs/ADMIN-SECURITY.md`, `docs/PRODUCTION-HARDENING-PLAN.md`, `.env.example`
- `src/routes/admin.tsx` (grant/revoke UI — follow-up)

---

## Phase 4 summary (2026-07-15)

### Goals

Make `hub_members` admin|mod|member meaningful for pin/delete/kick/set-role without Discord-style channel overrides or expanding platform god-mode.

### Done

1. **Migration** `20260715140000_phase4_hub_roles.sql` — `is_hub_mod` / `is_hub_admin`, pin protect trigger, hub-mod message UPDATE/DELETE policies, `hub_kick_member` / `hub_set_member_role` RPCs, role-write gateway for RPCs.
2. **`src/lib/hub/permissions.ts`** — capability matrix + kick hierarchy helpers.
3. **App wiring** — chat pin/delete/kick/set-role gated by hub caps (platform admin still overrides via service APIs); `MessageItem` hides pin when unauthorized; roster uses hub RPCs when not platform admin.
4. **Docs** — `docs/HUB-PERMISSIONS.md`, verify_schema / ops list updated.

### Migrations

- `supabase/migrations/20260715140000_phase4_hub_roles.sql`

### Env deltas

None.

### Tests

None automated. Manual: apply migration → promote a hub admin → mod can pin/delete/kick members → member cannot pin → last hub admin cannot be demoted via RPC.

### Unresolved after Phase 4

**None remaining** from the Phase 4 backlog:

- Founder promotion: first join to empty hub → hub `admin`; `/admin` hub create upserts creator as hub admin.
- Hub mod pin/delete/kick/set-role append to `admin_audit_log` (`hub_write_mod_audit` + triggers).
- Per-channel overrides remain an **intentional non-goal**.

### Phase 4 follow-up (unresolved closed)

- `supabase/migrations/20260715141000_phase4_founder_audit.sql`
- `adminUpsertHub` founder membership on create
- `docs/HUB-PERMISSIONS.md` updated

### Changed files (Phase 4)

- `supabase/migrations/20260715140000_phase4_hub_roles.sql`, `20260715141000_phase4_founder_audit.sql`, `supabase/migrations/README.md`, `supabase/verify_schema.sql`
- `src/lib/hub/permissions.ts`, `src/lib/chat/api.ts`, `src/lib/supabase/types.ts`, `src/lib/admin/api.ts`
- `src/hooks/use-hub-chat.ts`, `src/routes/index.tsx`, `src/components/message-item.tsx`
- `docs/HUB-PERMISSIONS.md`, `docs/PRODUCTION-HARDENING-PLAN.md`, `docs/DATABASE-OPERATIONS.md`

---

## Working rules (carry forward)

1. One phase only, then stop.
2. Do not claim “works” without evidence.
3. Do not mark production-ready from UI presence alone.
4. Do not weaken RLS for convenience.
5. No `VITE_*` for service role / LiveKit secrets / admin allowlists.
6. Prefer small typed modules and incremental migrations.
7. Preserve EN/AR and Capacitor safe-area behavior.
8. After each future phase: changed files, migrations, env deltas, tests, unresolved issues — then wait.

---

## Phase 5 summary (2026-07-15)

### Goals

Soft-delete for channel messages, fix “oldest N” list window, keep pin/mod behavior and admin delete consistent — without an edit-history table.

### Done

1. **Migration** `20260715150000_phase5_messages_reliability.sql` — `messages.deleted_at`, partial live indexes, `soft_delete_message` RPC, drop client hard-DELETE policies, identity/pin guards, SELECT hides soft-deleted rows, pin audit skips soft-delete UPDATEs.
2. **Chat API** — `deleteChannelMessage` → RPC; `fetchMessages` / `fetchMessage` filter live rows and load **latest N**.
3. **Realtime** — treat UPDATE with `deleted_at` as remove (alongside DELETE).
4. **Admin** — `adminDeleteMessage` soft-deletes via service role (same field clearing) + `message.soft_delete` audit.
5. **Server** — `listMessages` same latest-window + live filter.
6. **Docs** — `docs/MESSAGES.md`, verify_schema / ops list / types updated.
7. **Follow-up** — `message_edits`, DM soft-delete, before-cursor pagination + Load older UI; soft-delete body constraint hardened.

### Migrations

- `supabase/migrations/20260715150000_phase5_messages_reliability.sql`
- `supabase/migrations/20260715151000_phase5_followup_edits_dms_pagination.sql`

### Env deltas

None.

### Tests

None automated. Manual: apply migration → author soft-delete → peers lose message via Realtime → mod soft-delete audited → channel with >80 messages shows newest window → admin delete soft-deletes.

### Unresolved after Phase 5

**None remaining** from the Phase 5 backlog:

- Edit history: `message_edits` + `messages_record_edit` trigger + `fetchMessageEdits`.
- DM soft-delete: `soft_delete_dm_message` + author delete in DM UI.
- Pagination: `before` cursor + “Load older messages” in hub chat.

### Phase 5 follow-up (unresolved closed)

- `supabase/migrations/20260715151000_phase5_followup_edits_dms_pagination.sql`
- Soft-delete body constraint fix (`' '` placeholder / `deleted_at` exemption)
- Docs / verify / types updated

### Changed files (Phase 5)

- `supabase/migrations/20260715150000_phase5_messages_reliability.sql`, `20260715151000_phase5_followup_edits_dms_pagination.sql`, `supabase/migrations/README.md`, `supabase/verify_schema.sql`
- `src/lib/chat/api.ts`, `src/hooks/use-hub-chat.ts`, `src/lib/admin/api.ts`, `src/server/messages.ts`, `src/lib/supabase/types.ts`
- `src/lib/social/api.ts`, `src/hooks/use-dms.ts`, `src/routes/dm.tsx`, `src/routes/index.tsx`, `src/lib/i18n.tsx`, `src/lib/mock-data.ts`, `src/server/dms.ts`
- `docs/MESSAGES.md`, `docs/PRODUCTION-HARDENING-PLAN.md`, `docs/DATABASE-OPERATIONS.md`, `docs/FEATURE-READINESS-MATRIX.md`, `docs/ARCHITECTURE-AUDIT.md`

---

## Phase 6 summary (2026-07-15)

### Goals

Channel/DM read cursors with real unread badges (separate from notification dock), and a thin presence model driven by `profiles.status` rather than mock-only online lists.

### Done

1. **Migration** `20260715160000_phase6_read_state_presence.sql` — `channel_member_states`, DM participant UPDATE policy, `mark_channel_read` / `mark_dm_read`, `hub_channel_unreads` / `dm_thread_unread`, `set_presence`, `refresh_hub_active_count`, `profiles.last_seen_at`.
2. **Hub chat** — fetchChannels fills unread; open channel marks read; hub INSERT Realtime bumps other-channel badges; home live count refreshed from presence.
3. **DMs** — thread list uses `dm_thread_unread`; open thread marks read.
4. **Presence** — `usePresenceHeartbeat` in AuthProvider (online / idle / offline).
5. **Docs** — `docs/PRESENCE-AND-READ-STATE.md`, verify/ops/types updated.
6. **Follow-up** — typing broadcast, DND Availability on `/me`, dock unread totals, live inactive-DM badges.

### Migrations

- `supabase/migrations/20260715160000_phase6_read_state_presence.sql`
- `supabase/migrations/20260715161000_phase6_followup_unread_totals.sql`

### Env deltas

None.

### Tests

None automated. Manual: apply migration → send message in channel B while viewing A → badge on B → open B clears → DM unread similarly → leave tab → profile becomes offline for peers after refresh.

### Unresolved after Phase 6

**None remaining** from the Phase 6 backlog:

- Typing indicators (Realtime broadcast).
- DND on `/me` that survives heartbeat.
- Dock channel/DM unread aggregates (`user_message_unread_totals`).
- Live badges for inactive DM threads while DM page is open.

### Phase 6 follow-up (unresolved closed)

- `supabase/migrations/20260715161000_phase6_followup_unread_totals.sql`
- `src/hooks/use-typing-indicator.ts`, `use-message-unread-totals.ts`
- Composer typing label; bottom-dock Home/Messages badges; `/me` Availability select

### Changed files (Phase 6)

- `supabase/migrations/20260715160000_phase6_read_state_presence.sql`, `20260715161000_phase6_followup_unread_totals.sql`, `supabase/migrations/README.md`, `supabase/verify_schema.sql`
- `src/lib/chat/api.ts`, `src/lib/social/api.ts`, `src/hooks/use-hub-chat.ts`, `src/hooks/use-dms.ts`, `src/hooks/use-presence-heartbeat.ts`, `src/hooks/use-typing-indicator.ts`, `src/hooks/use-message-unread-totals.ts`, `src/lib/auth-provider.tsx`, `src/server/dms.ts`, `src/lib/supabase/types.ts`
- `src/components/composer.tsx`, `src/components/bottom-dock.tsx`, `src/routes/index.tsx`, `src/routes/dm.tsx`, `src/routes/me.tsx`, `src/lib/i18n.tsx`
- `docs/PRESENCE-AND-READ-STATE.md`, `docs/PRODUCTION-HARDENING-PLAN.md`, `docs/DATABASE-OPERATIONS.md`, `docs/FEATURE-READINESS-MATRIX.md`, `docs/ARCHITECTURE-AUDIT.md`

---

## Phase 7 summary (2026-07-15)

### Goals

DB-enforced spam guards on channel/DM send, reports, and friend requests — without moving chat onto Nitro or blocking normal conversation.

### Done

1. **Migration** `20260715170000_phase7_rate_limits.sql` — burst/minute message limits, report hour + per-target day caps, friend request daily cap; author indexes; `service_role` skip.
2. **Client** — `src/lib/rate-limit.ts` maps `rate_limited:*` to friendly errors in chat/social APIs; register/forgot/login UX cooldowns.
3. **Docs** — `docs/RATE-LIMITS.md`, verify/ops/plan/matrix updated.
4. **Follow-up** — edit + reaction DB caps; Auth/Cloudflare ops checklist in `RATE-LIMITS.md`.

### Migrations

- `supabase/migrations/20260715170000_phase7_rate_limits.sql`
- `supabase/migrations/20260715171000_phase7_followup_edit_reaction_limits.sql`

### Env deltas

None. Enable Supabase Auth Dashboard rate limits separately for signup/signin/reset (see checklist in `RATE-LIMITS.md`).

### Tests

None automated. Manual: apply migration → spam 6 channel messages in 5s → toast “sending too fast” → spam edits/reactions → reports → friend request day cap.

### Unresolved after Phase 7

**None remaining** from the Phase 7 backlog that belongs in-repo:

- Edit/reaction flood capped (`edit_*` / `reaction_*` triggers).
- Auth Dashboard + Cloudflare edge: **ops checklist documented** (must be ticked per environment; cannot automate without live credentials).
- Attachment scan/quota remains **Phase 8** (intentional).

### Phase 7 follow-up (unresolved closed)

- `supabase/migrations/20260715171000_phase7_followup_edit_reaction_limits.sql`
- Login 3s cooldown; `RATE-LIMITS.md` ops checklists

### Changed files (Phase 7)

- `supabase/migrations/20260715170000_phase7_rate_limits.sql`, `20260715171000_phase7_followup_edit_reaction_limits.sql`, `supabase/migrations/README.md`, `supabase/verify_schema.sql`
- `src/lib/rate-limit.ts`, `src/lib/chat/api.ts`, `src/lib/social/api.ts`
- `src/routes/register.tsx`, `src/routes/forgot-password.tsx`, `src/routes/login.tsx`, `src/lib/i18n.tsx`
- `docs/RATE-LIMITS.md`, `docs/PRODUCTION-HARDENING-PLAN.md`, `docs/DATABASE-OPERATIONS.md`, `docs/FEATURE-READINESS-MATRIX.md`, `docs/ARCHITECTURE-AUDIT.md`, `docs/MESSAGES.md`

---

## Phase 8 summary (2026-07-15)

### Goals

Align Storage bucket MIME/size limits with client preflight and DB CHECKs; harden upload paths — without building an AV scanning pipeline.

### Done

1. **Migration** `20260715180000_phase8_storage_security.sql` — reassert avatars/attachments/hub-media limits + MIME; path-hygiene on upload policies; `attachment_mime` CHECKs on messages/DMs.
2. **`storage-policy.ts` + `storage.ts`** — shared allowlists/sizes; reject octet-stream, blocked extensions, oversize files; avatar extension from MIME.
3. **Callers** — Composer/me/admin accepts narrowed to exact MIME; admin hub upload uses shared constants.
4. **Docs** — `docs/STORAGE-SECURITY.md`.

### Migrations

- `supabase/migrations/20260715180000_phase8_storage_security.sql`

### Env deltas

None.

### Tests

None automated. Manual: apply migration → upload gif avatar OK → reject oversized attachment → reject `.exe` / weird MIME → message insert with bad `attachment_mime` fails CHECK.

### Unresolved after Phase 8

- Malware / virus scanning pipeline (intentional deferral).

### Phase 8 follow-up (unresolved closed)

Closed the remaining Phase 8 backlog except AV:

1. **Migration** `20260715181000_phase8_followup_private_attachments.sql` — `attachments` private; authenticated SELECT; `attachment_bytes_used()`.
2. **Content sniff** — magic bytes in `storage-policy.ts`; upload refuses MIME/content mismatch.
3. **Quota** — 100 MiB/user soft cap via `attachment_bytes_used` before upload.
4. **Signed URLs** — persist `storage://attachments/…`; UI resolves via `resolveAttachmentUrl` in `message-item`.

### Changed files (Phase 8)

- `supabase/migrations/20260715180000_phase8_storage_security.sql`, `20260715181000_phase8_followup_private_attachments.sql`, `supabase/migrations/README.md`, `supabase/verify_schema.sql`
- `src/lib/supabase/storage-policy.ts`, `src/lib/supabase/storage.ts`, `src/lib/supabase/types.ts`, `src/components/composer.tsx`, `src/components/message-item.tsx`, `src/routes/me.tsx`, `src/routes/admin.tsx`, `src/lib/admin/api.ts`
- `docs/STORAGE-SECURITY.md`, `docs/PRODUCTION-HARDENING-PLAN.md`, `docs/DATABASE-OPERATIONS.md`, `docs/FEATURE-READINESS-MATRIX.md`, `docs/RATE-LIMITS.md`, `docs/ARCHITECTURE-AUDIT.md`

---

## Phase 9 summary (2026-07-15)

### Goals

Deepen reports workflow, ship Community Guidelines, close the DM-after-block hole — without rebuilding hub mod tools or account deletion.

### Done

1. **Migration** `20260715190000_phase9_trust_safety.sql` — `dm_message_id` + review metadata; reason allowlist; tighter INSERT policy; `dm_messages` INSERT blocked when either party is blocked.
2. **Guidelines** — `/guidelines` + register/settings/legal/sitemap links (EN/AR).
3. **Report UX** — reason dialog for hub messages, DMs, profile; `submitReport` supports DM targets.
4. **Admin** — filter open/reviewing/resolved/dismissed/all; Mark reviewing; resolution notes; message/DM ids shown.
5. **Docs** — `docs/TRUST-SAFETY.md`.

### Migrations

- `supabase/migrations/20260715190000_phase9_trust_safety.sql`

### Env deltas

None.

### Tests

None automated. Manual: apply migration → report channel msg with reason → report DM → report profile → admin Reviewing/Resolve with note → block user → cannot send DM in existing thread.

### Unresolved after Phase 9

- Account deletion / data export (Phase 10).
- Reporter notifications (Phase 11).
- Auto-mod / NSFW filters.
- Hub-mod report inbox (deferred — needs separate SELECT/UI slice).
- AV scan (still deferred from Phase 8).

### Phase 9 follow-up (unresolved closed)

Closed in-repo leftovers that belong to Phase 9:

1. **Migration** `20260715191000_phase9_followup_blocks_reports.sql` — cannot report own messages; `list_hub_members_visible` filters mutual blocks.
2. **Hub roster** — `fetchHubMembers` uses the RPC (legacy select fallback).
3. **UX** — hub Report hidden on own messages; profile Block next to Report.

### Changed files (Phase 9)

- `supabase/migrations/20260715190000_phase9_trust_safety.sql`, `20260715191000_phase9_followup_blocks_reports.sql`, `supabase/migrations/README.md`, `supabase/verify_schema.sql`
- `src/lib/trust-safety.ts`, `src/lib/social/api.ts`, `src/lib/admin/api.ts`, `src/lib/chat/api.ts`, `src/lib/supabase/types.ts`, `src/lib/i18n.tsx`
- `src/components/report-dialog.tsx`, `src/components/legal-page.tsx`
- `src/routes/guidelines.tsx`, `index.tsx`, `dm.tsx`, `profile.$username.tsx`, `admin.tsx`, `register.tsx`, `settings.tsx`, `sitemap[.]xml.ts`, `routeTree.gen.ts`
- `docs/TRUST-SAFETY.md`, `docs/PRODUCTION-HARDENING-PLAN.md`, `docs/DATABASE-OPERATIONS.md`, `docs/FEATURE-READINESS-MATRIX.md`, `docs/ARCHITECTURE-AUDIT.md`

---

## Phase 10 summary (2026-07-15)

### Goals

Self-service data export and account deletion, plus global sign-out hygiene — without building 2FA or a session-list UI.

### Done

1. **Migration** `20260715200000_phase10_account_lifecycle.sql` — `account_deletion_log` (survives cascade wipe).
2. **`requireAuth`** + **`exportMyData` / `deleteMyAccount`** server fns (JWT self-service; delete uses service-role `auth.admin.deleteUser` + storage prefix cleanup).
3. **Settings → Account** — export download; danger-zone delete with username + `DELETE` confirm.
4. **Session hygiene** — `signOut` defaults to `scope: "global"`.
5. **Privacy copy** — points to in-product export/delete.
6. **Docs** — `docs/ACCOUNT-LIFECYCLE.md`.

### Migrations

- `supabase/migrations/20260715200000_phase10_account_lifecycle.sql`

### Env deltas

None new (reuses service role already required for admin).

### Tests

None automated. Manual: export JSON → confirm delete with wrong username fails → correct username + DELETE → cannot log in → profile gone; logout clears refresh across devices.

### Unresolved after Phase 10

- Real 2FA / TOTP (still Settings “Soon”).
- Per-device session list / selective revoke-by-id.
- Soft-delete / anonymize authored messages instead of hard CASCADE.
- Deletion confirmation email/push (Phase 11).

### Phase 10 follow-up (unresolved closed)

Closed thin session + identity leftovers (no migration):

1. **Sign out other sessions** — Settings → `signOut({ scope: "others" })`.
2. **OAuth unlink** — Google/Discord via `getUserIdentities` / `unlinkIdentity` (keep ≥1 method).

### Changed files (Phase 10)

- `supabase/migrations/20260715200000_phase10_account_lifecycle.sql`, `supabase/migrations/README.md`, `supabase/verify_schema.sql`
- `src/lib/auth/require-auth.ts`, `src/lib/account/api.ts`, `src/lib/supabase/auth.ts`, `src/lib/supabase/types.ts`, `src/lib/i18n.tsx`
- `src/routes/settings.tsx`
- `docs/ACCOUNT-LIFECYCLE.md`, `docs/PRODUCTION-HARDENING-PLAN.md`, `docs/DATABASE-OPERATIONS.md`, `docs/FEATURE-READINESS-MATRIX.md`, `docs/ARCHITECTURE-AUDIT.md`

---

## Phase 11 summary (2026-07-15)

### Goals

Device registry + opt-in Web Push path beyond in-app Realtime — without requiring App Store push certs on day one.

### Done

1. **Migration** `20260715210000_phase11_push_devices.sql` — `push_devices` + `user_prefs.push_enabled`.
2. **Register / unregister** server fns + browser client (`enableBrowserPush`).
3. **Send** — `web-push` when VAPID keys present; Cap tokens stored but not sent yet.
4. **Webhook** — `POST /api/push-dispatch` with `PUSH_DISPATCH_SECRET`.
5. **Settings** — Desktop notifications toggle (permission + subscription).
6. **SW** — push + notificationclick handlers.
7. **Docs** — `docs/PUSH.md`.

### Migrations

- `supabase/migrations/20260715210000_phase11_push_devices.sql`

### Env deltas

Optional: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `VITE_VAPID_PUBLIC_KEY`, `PUSH_DISPATCH_SECRET`.

### Tests

None automated. Manual: apply migration → set VAPID keys → enable Desktop in Settings → allow permission → insert a notification while tab hidden / via webhook → OS notification appears.

### Unresolved after Phase 11

- Live FCM/APNs send for Cap tokens.
- Match DND suppressing server/webhook push (client toasts only).
- Reporter/deletion email templates (no mail transport).
- VoIP push / CallKit (deferred; not required for Phase 12 core reliability).

### Phase 11 follow-up (unresolved closed)

1. **Prefs** — `notif_sound`, `notif_mentions_only`, `notif_match_dnd` + Settings toggles + provider filters.
2. **Cap register** — `@capacitor/push-notifications` stores ios/android tokens (send still deferred).

### Changed files (Phase 11)

- `supabase/migrations/20260715210000_phase11_push_devices.sql`, `20260715211000_phase11_followup_notif_prefs.sql`, `supabase/migrations/README.md`, `supabase/verify_schema.sql`
- `src/lib/push/api.ts`, `src/lib/push/client.ts`, `src/lib/push/native.ts`, `src/lib/notifications-provider.tsx`, `src/lib/supabase/profile.ts`, `src/lib/supabase/types.ts`, `src/lib/i18n.tsx`
- `src/routes/settings.tsx`, `src/routes/api/push-dispatch.ts`, `src/routeTree.gen.ts`
- `public/sw.js`, `.env.example`
- `docs/PUSH.md`, `docs/PRODUCTION-HARDENING-PLAN.md`, `docs/DATABASE-OPERATIONS.md`, `docs/FEATURE-READINESS-MATRIX.md`, `docs/ARCHITECTURE-AUDIT.md`
- `package.json` (`web-push`, `@capacitor/push-notifications`)

---

## Phase 12 summary (2026-07-15)

### Goals

Make LiveKit voice resilient under disconnects and clearer for ops — without shipping CallKit/VoIP push.

### Done

1. **Reconnect** — LiveKit reconnect events + bounded remint reconnect after hard disconnect (3 attempts).
2. **Mute/deafen** — Preferences preserved across reconnect; dock syncs from session.
3. **Leave hygiene** — Dock clears parent voice channel when session becomes null.
4. **Token** — TTL `1h`; clearer AUTH/FORBIDDEN/RATE_LIMITED errors; per-user mint cap (12/min/process).
5. **Health** — `getVoiceHealth` surfaced in Settings → Voice.
6. **Docs** — `docs/VOICE.md`.

### Migrations

None.

### Env deltas

Unchanged: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`.

### Tests

None automated. Manual: configure LiveKit → join hub/DM voice → mute/deafen → toggle network briefly → confirm reconnect UI → hang up clears dock.

### Unresolved after Phase 12

- VoIP push / CallKit.
- Capacitor native audio session.
- Cross-worker mint rate limits.
- SFU ops dashboard / Discord-scale voice features.

### Phase 12 follow-up (unresolved closed)

1. **Cross-worker mint limit** — migration `20260715221000_phase12_followup_voice_mint_limit.sql` (`voice_token_mints` + `claim_voice_token_mint`, 12/min); in-process fallback if RPC missing.
2. **Cap audio** — iOS `AVAudioSession` + background audio mode; Screen Wake Lock while connected.
3. **Thin ops surface** — Admin header shows LiveKit health (not a full SFU dashboard).

Still deferred: VoIP/CallKit, full SFU dashboard, Discord-scale features.

### Changed files (Phase 12)

- `src/lib/voice/livekit-client.ts`, `livekit-stub.ts`, `types.ts`, `create-voice-token.ts`
- `src/components/voice-dock.tsx`, `src/routes/settings.tsx`, `src/lib/i18n.tsx`
- `docs/VOICE.md`, `docs/PRODUCTION-HARDENING-PLAN.md`, `docs/FEATURE-READINESS-MATRIX.md`, `docs/ARCHITECTURE-AUDIT.md`, `docs/PUSH.md`, `docs/RATE-LIMITS.md`

### Changed files (Phase 12 follow-up)

- `supabase/migrations/20260715221000_phase12_followup_voice_mint_limit.sql`, `supabase/migrations/README.md`, `supabase/verify_schema.sql`
- `src/lib/voice/create-voice-token.ts`, `native-audio.ts`, `livekit-client.ts`, `livekit-stub.ts`
- `src/lib/supabase/types.ts`, `src/lib/rate-limit.ts`, `src/routes/admin.tsx`
- `ios/App/App/AppDelegate.swift`, `ios/App/App/Info.plist`
- `docs/VOICE.md`, `docs/PRODUCTION-HARDENING-PLAN.md`, `docs/RATE-LIMITS.md`, `docs/DATABASE-OPERATIONS.md`

---

## Phase 13 summary (2026-07-15)

### Goals

Finish user-facing AR/RTL and a11y gap-fill on the existing i18n foundation — without redesign or admin translation.

### Done

1. **Strings** — chat menus (`message-item`), voice dock, hub/DM/friends/discover/composer toasts, root error page, emoji/panel aria.
2. **RTL** — message menu `me-` margins; Radix switch thumb RTL translate; early `dir` bootstrap script.
3. **Typography** — Noto Sans Arabic; disable forced uppercase under `lang=ar`.
4. **Persist** — language also written to cookie alongside `localStorage`.
5. **Docs** — `docs/I18N-RTL.md`.

### Migrations

None.

### Tests

Manual: Settings → العربية → hubs sheet, composer, message actions, voice dock, toasts, skip link, reduce-motion.

### Unresolved after Phase 13

- Admin console i18n.
- Full remirroring of unused `ui/*` primitives.
- Bilingual SEO meta per route.
- First-visit locale auto-detect.
- Cookie-driven SSR React string hydrate (bootstrap only sets `lang`/`dir`).
- Automated a11y CI (axe).

### Phase 13 follow-up (unresolved closed)

1. **Auto-detect** — first visit uses `navigator.language` (+ bootstrap script) when no storage/cookie.
2. **Runtime meta** — `document.title` + description follow language (`meta.*` keys).
3. **High-traffic UI RTL** — sheet/dialog/alert/drawer close + text-start; dropdown logical padding/chevrons.
4. **Docs** — manual a11y smoke checklist in `I18N-RTL.md`.

Still deferred: admin i18n, exhaustive `ui/*`, crawler OG SSR, axe CI.

### Changed files (Phase 13)

- `src/lib/i18n.tsx`, `src/styles.css`
- `src/components/message-item.tsx`, `voice-dock.tsx`, `composer.tsx`, `app-shell.tsx`, `bottom-dock.tsx`, `emoji-picker.tsx`, `ui/switch.tsx`
- `src/routes/__root.tsx`, `index.tsx`, `dm.tsx`, `friends.tsx`, `discover.tsx`
- `docs/I18N-RTL.md`, `docs/PRODUCTION-HARDENING-PLAN.md`, `docs/FEATURE-READINESS-MATRIX.md`, `docs/ARCHITECTURE-AUDIT.md`

### Changed files (Phase 13 follow-up)

- `src/lib/i18n.tsx`, `src/routes/__root.tsx`
- `src/components/ui/sheet.tsx`, `dialog.tsx`, `alert-dialog.tsx`, `drawer.tsx`, `dropdown-menu.tsx`
- `docs/I18N-RTL.md`, `docs/PRODUCTION-HARDENING-PLAN.md`

---

## Phase 14 summary (2026-07-15)

### Goals

Phone dock / sheet / density polish without a visual redesign.

### Done

1. **Dock tokens** — `--dock-base-height`, `--dock-clearance` drive dock min-height and YouMenu/sheet offsets.
2. **Sheets** — fixed modal overlay covering dock; bottom sheets sit above clearance (no double `pb-safe`).
3. **Breakpoint hygiene** — brand lift and YouMenu width at `md` (768); `useIsMobile` assumes phone until measured.
4. **Density** — tighter lists/composer/voice; DM collapses list header while a thread is open; settings/friends bottom pad.
5. **Docs** — `docs/MOBILE.md`.

### Migrations

None.

### Tests

Manual: hubs sheet vs dock, voice+composer+dock stack, DM thread chrome, settings scroll, EN/AR dock.

### Unresolved after Phase 14

- Capacitor dual-mode remote shell ✅ (Phase 15; see `CAPACITOR.md`).
- Desktop primary rail (dock remains on large screens by design).
- Keyboard-safe composer proof on Cap devices.
- Discord-scale navigation IA.

### Phase 14 follow-up (unresolved closed)

1. **Keyboard hygiene** — `useKeyboardInset` + hide dock while keyboard open (`data-keyboard-open`); Cap plugin listens without double-padding Body resize.
2. **Focus trap** — Tab containment on app `Sheet` + YouMenu.
3. **Breakpoint align** — `isPhoneLikeUi` uses `MOBILE_BREAKPOINT` from `use-mobile`.
4. **Docs** — Cap keyboard smoke checklist in `MOBILE.md`.

Still deferred: Cap bundled client / desktop rail / Discord IA / automated Cap keyboard CI.

### Changed files (Phase 14)

- `src/styles.css`, `src/hooks/use-mobile.tsx`
- `src/components/app-shell.tsx`, `bottom-dock.tsx`, `composer.tsx`, `voice-dock.tsx`
- `src/routes/index.tsx`, `dm.tsx`, `settings.tsx`, `friends.tsx`
- `docs/MOBILE.md`, `docs/PRODUCTION-HARDENING-PLAN.md`, `docs/FEATURE-READINESS-MATRIX.md`, `docs/ARCHITECTURE-AUDIT.md`

### Changed files (Phase 14 follow-up)

- `src/hooks/use-keyboard-inset.ts`, `src/lib/focus-trap.ts`, `src/lib/capacitor.ts`, `src/styles.css`
- `src/components/app-shell.tsx`, `bottom-dock.tsx`, `src/routes/__root.tsx`
- `docs/MOBILE.md`, `docs/PRODUCTION-HARDENING-PLAN.md`

---

## Phase 15 summary (2026-07-15)

### Goals

Reduce remote-shell risk with dual-mode honesty and fail-closed Cap packaging — without claiming local SSR in `www/`.

### Done

1. **Docs** — `docs/CAPACITOR.md` (remote vs local; createServerFn constraint).
2. **Prepare** — remote bridge with reachability/retry; local honest shell; no `.output/public` copy (false bundled SSR).
3. **Inject / config** — HTTPS fail-closed + `server.allowNavigation` host allowlist.
4. **CI** — Codemagic sets `CAPACITOR_REQUIRE_SERVER=1` before prepare.
5. **UX** — Cap offline banner (`navigator.onLine`) with reload.
6. **Scripts** — `cap:sync:local` for shell-only sync without inject.

### Migrations

None.

### Tests

Manual: `CAPACITOR_SERVER_URL` set → prepare writes remote bridge; inject fails without URL; Cap offline strip when toggled offline; Codemagic env group has HTTPS URL.

### Unresolved after Phase 15

- True offline/SPA Cap product (needs API split — not webDir SSR).
- Android Cap workflow.
- App Store certs / ASC packaging (Phase 18).
- APNs/FCM send + Guideline 4.2 full mitigation via native IA.
- Automated Cap E2E CI.

### Phase 15 follow-up (unresolved closed)

1. **Packaging smoke** — `npm run cap:smoke` (+ Codemagic `web-smoke`); tests allowNavigation, prepare remote/local, REQUIRE_SERVER fail-closed, SPM/android warnings.
2. **allowNavigation** — includes Supabase host from `VITE_SUPABASE_URL` / `SUPABASE_URL`.
3. **Android path documented** — add/`sync android` steps in `CAPACITOR.md` (no `android/` tree yet).
4. **4.2 review notes** — native capability inventory for ASC (not a claim of full mitigation).

Still deferred: SPA Cap launch binary, Play CI, APNs send, ASC cert packaging, device E2E.

### Changed files (Phase 15)

- `capacitor.config.ts`, `package.json`, `codemagic.yaml`, `.env.example`
- `scripts/resolve-capacitor-server.cjs`, `prepare-capacitor-www.cjs`, `inject-capacitor-server-url.cjs`
- `src/components/cap-offline-banner.tsx`, `app-shell.tsx`, `src/lib/i18n.tsx`
- `docs/CAPACITOR.md`, `docs/MOBILE.md`, `docs/PRODUCTION-HARDENING-PLAN.md`, `docs/FEATURE-READINESS-MATRIX.md`, `docs/ARCHITECTURE-AUDIT.md`

### Changed files (Phase 15 follow-up)

- `scripts/smoke-capacitor.cjs`, `resolve-capacitor-server.cjs`, `capacitor.config.ts`, `package.json`, `codemagic.yaml`
- `docs/CAPACITOR.md`, `docs/PRODUCTION-HARDENING-PLAN.md`

---

## Phase 16 summary (2026-07-15)

### Goals

Logging, health, and ops runbooks — without a full APM vendor.

### Done

1. **Dual health** — `collectAppHealth` (Supabase probe + LiveKit config); `getAppHealth` server fn.
2. **Public probe** — `GET /api/health` → 200/503 JSON for uptime / post-deploy.
3. **Admin chips** — DB games count + LiveKit live/stub.
4. **Structured logs** — `logEvent` JSON helper; wired into health failures, push-dispatch auth, server unhandled errors.
5. **Docs** — `docs/OPS.md` (incident starters + pointers).

### Migrations

None.

### Tests

Manual: `curl /api/health` on deploy; Admin header chips; kill service role → 503.

### Unresolved after Phase 16

- Datadog / Sentry / OpenTelemetry APM.
- Slack / PagerDuty paging.
- LiveKit synthetic TURN probes / SFU dashboard.
- Automated post-deploy health hit in Codemagic.

### Phase 16 follow-up (unresolved closed)

1. **CI health hit** — `npm run ops:health` + Codemagic `web-smoke` step (skips without URL; `OPS_HEALTH_REQUIRE=1` fail-closed).
2. **LiveKit reachability** — HTTPS GET `/` on SFU host in `collectAppHealth` (`reachable` / `probeMs`); Admin chip shows unreachable.
3. **Alert hooks** — `OPS_ALERT_WEBHOOK_URL` (Slack) + `OPS_PAGERDUTY_ROUTING_KEY` (Events API v2); error `logEvent` fans out rate-limited.
4. **APM path** — documented JSON log drain → Datadog/Sentry/OTel (no vendor SDK yet).

Still deferred: full APM SDKs, managed on-call schedules, TURN/ICE synthetics, Discord-scale ops dashboard.

### Changed files (Phase 16)

- `src/lib/ops/health.ts`, `src/lib/ops/log.ts`, `src/server/health.ts`, `src/server/auth.ts`, `src/start.ts`
- `src/routes/api/health.ts`, `src/routes/api/push-dispatch.ts`, `src/routes/admin.tsx`, `src/routeTree.gen.ts`
- `docs/OPS.md`, `docs/PRODUCTION-HARDENING-PLAN.md`, `docs/FEATURE-READINESS-MATRIX.md`, `docs/ARCHITECTURE-AUDIT.md`, `LAUNCH.md`, `BACKEND.md`

### Changed files (Phase 16 follow-up)

- `src/lib/ops/alert.ts`, `src/lib/ops/health.ts`, `src/lib/ops/log.ts`, `src/routes/admin.tsx`
- `scripts/smoke-health.cjs`, `package.json`, `codemagic.yaml`, `.env.example`
- `docs/OPS.md`, `docs/VOICE.md`, `docs/PRODUCTION-HARDENING-PLAN.md`, `docs/FEATURE-READINESS-MATRIX.md`, `docs/ARCHITECTURE-AUDIT.md`

---

## Phase 17 summary (2026-07-15)

### Goals

Automated tests, typecheck CI gate, and security verification.

### Done

1. **Vitest** — `npm test` (19 tests): rate-limit, storage-policy, hub permissions, report reasons, `parseAdminIds`, prod env fail-closed.
2. **Scoped typecheck gate** — `npm run typecheck` → `tsconfig.ci.json` (must stay green). `typecheck:full` still has residual debt (~31).
3. **DB types shape** — `Relationships: []`, empty Views/Enums/CompositeTypes, `Update: { [_ in never]: never }` so supabase-js accepts schema (full `tsc` ~255 → ~31).
4. **Security smoke** — `npm run smoke:security` (CSRF, headers, prod asserts, no `VITE_` secret leaks, `npm audit` high+).
5. **CI** — Codemagic `web-smoke`: test → typecheck → smoke:security → build → cap/ops.
6. **Docs** — `docs/TESTING-SECURITY.md`.

### Migrations

None.

### Tests

`npm test` + `npm run typecheck` + `npm run smoke:security` (all green in this pass).

### Unresolved after Phase 17

- Full-repo `tsc` green (Router `search`, residual RPC/LiveKit/push).
- ESLint/Prettier CI green.
- Playwright E2E / live RLS integration tests.
- Dependabot / automated dependency PRs.

### Phase 17 follow-up (unresolved closed)

1. **Full `tsc` green** — HomeSearch optional typing, FK `Relationships`, missing friend/DM RPCs, LiveKit/push/account/settings edges; `npm run typecheck:full` exit 0.
2. **ESLint CI** — `eslint.ci.config.js` + `npm run lint:ci` (prettier style is local `format`, not a merge blocker).
3. **Dependabot** — `.github/dependabot.yml` weekly npm groups.
4. **RLS artifacts in smoke** — `smoke:security` asserts `verify_schema` + core `ENABLE ROW LEVEL SECURITY`; live apply remains operator-run.

Still deferred: Playwright + live-DB E2E, Prettier-as-gate, malware scan.

### Changed files (Phase 17)

- `src/lib/supabase/types.ts`, `vitest.config.ts`, `tsconfig.ci.json`, `package.json`, `codemagic.yaml`, `package-lock.json`
- `src/lib/*.test.ts`, `src/lib/hub/permissions.test.ts`, `src/lib/supabase/*.test.ts`, `src/lib/admin/authz.test.ts`
- `scripts/smoke-security.cjs`
- `docs/TESTING-SECURITY.md`, `docs/PRODUCTION-HARDENING-PLAN.md`, `docs/FEATURE-READINESS-MATRIX.md`, `docs/ARCHITECTURE-AUDIT.md`, `LAUNCH.md`

### Changed files (Phase 17 follow-up)

- `src/lib/supabase/types.ts`, `src/lib/chat/api.ts`, `src/lib/social/api.ts`, `src/lib/account/api.ts`, `src/lib/supabase/profile.ts`
- `src/lib/voice/livekit-client.ts`, `src/lib/push/client.ts`, `src/routes/*`, `src/components/*`
- `eslint.ci.config.js`, `.github/dependabot.yml`, `scripts/smoke-security.cjs`, `package.json`, `codemagic.yaml`
- `docs/TESTING-SECURITY.md`, `docs/PRODUCTION-HARDENING-PLAN.md`, `docs/FEATURE-READINESS-MATRIX.md`, `docs/ARCHITECTURE-AUDIT.md`

---

## Phase 18 summary (2026-07-15)

### Goals

ASC checklist, store copy, TestFlight readiness, launch gates.

### Done

1. **`docs/APP-STORE.md`** — identity, EN store draft, privacy questionnaire draft, export compliance, Review Notes / 4.2 template, TestFlight + ASC packaging checklists.
2. **`LAUNCH.md` rewrite** — go/no-go across infra → ASC; points at Ops / Testing / Cap / App Store docs; removes stale “defer storage/admin” claims.
3. **`npm run smoke:launch`** — Info.plist / PrivacyInfo / Cap identity / PWA icons / legal routes / Codemagic TestFlight wiring.
4. **Icons** — generated `public/icons/icon-192.png` + `icon-512.png` via `npm run icons`.
5. **CI** — Codemagic `web-smoke` + `ci:verify` include `smoke:launch`.

### Migrations

None.

### Tests

`npm run smoke:launch` (plus existing `ci:verify` suite).

### Unresolved after Phase 18

- Bundled Cap SPA (architecture).
- Automated ASC metadata upload (fastlane/deliver).
- Play / Android CI.
- APNs send + CallKit.
- Screenshot automation / live Playwright.

### Phase 18 follow-up (unresolved closed)

1. **Store package** — `docs/store/` listing + Review Notes + screenshot capture guide; `fastlane/Deliverfile` + metadata README.
2. **APNs + FCM send** — `src/lib/push/apns.ts` / `fcm.ts` wired into `sendPushToUser` (env-gated); CallKit still deferred.
3. **Android CI scaffold** — Codemagic `android-capacitor` fail-closed until `android/` exists; `npm run cap:android:init`.
4. **SPA rationale** — CAPACITOR.md documents why remote shell remains the submit path (not a packaging toggle).

Still deferred: CallKit/VoIP, FCM HTTP v1, Play signing secrets, screenshot binaries, true Cap SPA client.

### Changed files (Phase 18)

- `docs/APP-STORE.md`, `LAUNCH.md`, `docs/CAPACITOR.md`, `docs/PRODUCTION-HARDENING-PLAN.md`
- `docs/FEATURE-READINESS-MATRIX.md`, `docs/ARCHITECTURE-AUDIT.md`, `docs/TESTING-SECURITY.md`, `BACKEND.md`
- `scripts/smoke-launch.cjs`, `package.json`, `codemagic.yaml`
- `public/icons/icon-192.png`, `public/icons/icon-512.png`

### Changed files (Phase 18 follow-up)

- `src/lib/push/apns.ts`, `src/lib/push/fcm.ts`, `src/lib/push/api.ts`
- `docs/store/**`, `fastlane/**`, `docs/PUSH.md`, `docs/APP-STORE.md`, `docs/CAPACITOR.md`
- `codemagic.yaml`, `.env.example`, `package.json`, `scripts/smoke-launch.cjs`
- `docs/PRODUCTION-HARDENING-PLAN.md`, `docs/FEATURE-READINESS-MATRIX.md`, `docs/VOICE.md`

---

## Arabic-first impact (policy adoption — incremental pass pre–Phase 0 re-audit)

### Arabic UI changes

- Auth language toggle (AR first in control order); discover/settings loading + admin row localized  
- Message UGC `dir="auto"`; discover hub titles isolated  

### RTL testing

- Manual: auth shell lang flip; chat mixed strings — use `docs/RTL-TEST-CHECKLIST.md`  

### Mixed-direction handling

- Message author / body / reply previews use `dir="auto"`  

### Arabic search impact

- `src/lib/arabic-normalize.ts` + discover aliases; channel message search folds diacritics/tatweel  

### Moderation impact

- Docs only this pass (`MENA-MODERATION-GUIDE.md`); admin AR chrome still deferred  

### Unresolved Arabic-specific issues

- Region locale fallback; MENA discovery filters; hub templates; admin i18n; SSR EN string flash  

**Superseded for gap tracking by:** [`ARABIC-FIRST-AUDIT.md`](ARABIC-FIRST-AUDIT.md) (Phase 0 Arabic-first re-audit).

---

## Arabic-first Phase 1 summary (AF1 — 2026-07-15)

### Goals

Incremental foundations from the Phase 0 Arabic-first audit: complete high-traffic UGC bidi, bilingual rate-limit errors, stronger message search aliases — **not** MENA discovery or moderation assist.

### Done

1. `dir="auto"` on composer (input, reply author, mentions, typing, attachment), notifications title/body, report preview + details, admin report details/usernames/notes.  
2. Rate-limit user copy EN+AR via `html[lang]` in `withMappedDbError`.  
3. `expandArabicSearchTerms` + channel message search OR-ilike + client fold filter.  
4. Docs: `ARABIC-FIRST-PHASE1.md`; audit pointers updated.

### Migrations

None.

### Tests

`npm test -- --run src/lib/rate-limit.test.ts src/lib/arabic-normalize.test.ts` — pass.

### Unresolved after AF1

- Regional discovery, MENA assist, DB normalize column, admin i18n, region locale fallback, SSR EN flash, full `ui/*` logical CSS (see audit).

### Arabic-first impact

- **UI:** Rate-limit AR when language is Arabic.  
- **RTL:** No new layout chrome; checklist still applies.  
- **Bidi:** Composer / notifs / report / admin report UGC.  
- **Search:** Message aliases + haystack fold filter; DB index still open.  
- **Moderation:** Admin can read Arabic report text with isolation; assist Missing.  
- **Unresolved:** Audit gaps #1–2, region, SSR, etc.

### Changed files (AF1)

- `src/components/composer.tsx`, `report-dialog.tsx`  
- `src/routes/notifications.tsx`, `admin.tsx`  
- `src/lib/rate-limit.ts`, `rate-limit.test.ts`  
- `src/lib/arabic-normalize.ts`, `arabic-normalize.test.ts`, `chat/api.ts`  
- `docs/ARABIC-FIRST-PHASE1.md`, `ARABIC-FIRST-AUDIT.md`, `PRODUCTION-HARDENING-PLAN.md`, `I18N-RTL.md`, `FEATURE-READINESS-MATRIX.md`

---

## Arabic-first Phase 2 summary (AF2 — 2026-07-15)

### Goals

Regional / MENA discovery foundations from the Phase 0 audit (player region prefs, hub region tags, Discover filters, locale region fallback) — not hub templates or LFG.

### Done

1. Migration `user_prefs.region` + `hubs.region` + soft seed tags.  
2. `src/lib/regions.ts` + tests; Settings home region; Discover region chips + badges.  
3. Locale: storage → cookie → browser `ar*` → MENA region/timezone hint → EN; bootstrap script matches.  
4. Docs: `ARABIC-FIRST-PHASE2.md`.

### Migrations

- `supabase/migrations/20260715230000_af2_region_discovery.sql`

### Tests

`npm test -- --run src/lib/regions.test.ts` (+ prior AF1 suites).

### Unresolved after AF2

- Hub channel templates, regional LFG/events, admin region editor UI, Arabic T&S assist, DB normalize search column.

### Arabic-first impact

- **UI:** Region picker + Discover filters bilingual.  
- **RTL:** Filter chips wrap in RTL.  
- **Bidi:** Discover search isolated.  
- **Search:** Unchanged.  
- **Moderation:** Unchanged.  
- **Unresolved:** Audit gaps on templates / assist / DB search.

### Changed files (AF2)

- `supabase/migrations/20260715230000_af2_region_discovery.sql`, `verify_schema.sql`  
- `src/lib/regions.ts`, `regions.test.ts`, `i18n.tsx`, `mock-data.ts`, `supabase/types.ts`, `profile.ts`, `chat/api.ts`  
- `src/routes/discover.tsx`, `settings.tsx`, `__root.tsx`  
- `docs/ARABIC-FIRST-PHASE2.md`, `ARABIC-FIRST-AUDIT.md`, `PRODUCTION-HARDENING-PLAN.md`, `FEATURE-READINESS-MATRIX.md`, `AGENTS.md`

---

## Arabic-first Phase 3 summary (AF3 — 2026-07-15)

### Goals

MENA hub channel templates + admin region tagging; assistive Arabic/Arabizi report signals; moderator response templates; appeal copy — not auto-ban or full admin i18n.

### Done

1. `hub-templates.ts` + `adminApplyMenaChannelTemplate` + create-hub seed checkbox.  
2. Hub `region` in admin upsert/list UI.  
3. `arabic-assist.ts` chips + AR/EN note templates on Reports; Reports strings localized.  
4. `/help` appeal → `safety@nexus.app`.  
5. Docs: `ARABIC-FIRST-PHASE3.md`; MENA guide updated.

### Migrations

None (uses AF2 `region` columns).

### Tests

`npm test -- --run src/lib/moderation/arabic-assist.test.ts`

### Unresolved after AF3

- Full admin i18n; richer T&S playbooks; voice report context; DB search normalize; LFG product UX.

### Arabic-first impact

- **UI:** Arabic default channels; Reports AR chrome.  
- **RTL:** Admin follows document dir.  
- **Bidi:** Report UGC already isolated; notes `dir=auto`.  
- **Search:** Unchanged.  
- **Moderation:** Assist + templates; human decision remains.  
- **Unresolved:** Matrix gaps above.

### Changed files (AF3)

- `src/lib/hub-templates.ts`, `src/lib/moderation/arabic-assist.ts` (+ test)  
- `src/lib/admin/api.ts`, `src/routes/admin.tsx`, `help.tsx`, `i18n.tsx`  
- `docs/ARABIC-FIRST-PHASE3.md`, `MENA-MODERATION-GUIDE.md`, `PRODUCTION-HARDENING-PLAN.md`, `AGENTS.md`

---

## Arabic-first Phase 4 summary (AF4 — 2026-07-15)

### Goals

DB-normalized Arabic search for channel/DM messages so folded queries match diacritic/tatweel bodies — display `body` unchanged.

### Done

1. Migration `20260715240000_af4_arabic_search_norm.sql` — `normalize_arabic_for_search`, columns, triggers, backfill, `pg_trgm` indexes.  
2. Channel search uses `body_search_norm` + `expandArabicSearchNormTerms`.  
3. Types, `verify_schema`, unit test for norm term expand.  
4. Docs: `ARABIC-FIRST-PHASE4.md`.

### Migrations

- `supabase/migrations/20260715240000_af4_arabic_search_norm.sql` — **apply on each env**

### Tests

`npm test -- --run src/lib/arabic-normalize.test.ts`

### Unresolved after AF4

- Full admin i18n; LFG product UX; voice report attach; SSR/head hydrate; hub catalog search_norm; font subset.

### Arabic-first impact

- **UI:** Unchanged.  
- **RTL / bidi:** Unchanged.  
- **Arabic search:** DB fold + trigram; aliases via expand.  
- **Moderation:** Original body preserved.  
- **Unresolved:** Deferred list above.

### Changed files (AF4)

- `supabase/migrations/20260715240000_af4_arabic_search_norm.sql`, `migrations/README.md`, `verify_schema.sql`  
- `src/lib/arabic-normalize.ts` (+ test), `chat/api.ts`, `supabase/types.ts`  
- `docs/ARABIC-FIRST-PHASE4.md`, `ARABIC-FIRST-AUDIT.md`, `PRODUCTION-HARDENING-PLAN.md`, `FEATURE-READINESS-MATRIX.md`, `AGENTS.md`

---

## Arabic-first Phase 5 summary (AF5 — 2026-07-15)

Admin chrome i18n + bilingual document titles. See [`ARABIC-FIRST-PHASE5.md`](ARABIC-FIRST-PHASE5.md).

### Done

Admin shell/tabs/health/hub fields/template CTA; `meta.page.*` + `translateStatic` + LocalizedShell path title sync.

### Unresolved after AF5

Residual admin Games toasts/fields; deep SSR hydrate.

---

## Arabic-first Phase 6 summary (AF6 — 2026-07-15)

Discover LFG filter via `hubs.has_lfg`. See [`ARABIC-FIRST-PHASE6.md`](ARABIC-FIRST-PHASE6.md).

### Migrations

`20260715250000_af6_hub_has_lfg.sql` — apply per env.

### Unresolved after AF6

In-hub LFG board; voice report attach; font/perf; remaining admin EN.

---

## Arabic-first Phase 7 summary (AF7 — 2026-07-15)

Games admin i18n, in-hub LFG jump/badge, font weight trim. See [`ARABIC-FIRST-PHASE7.md`](ARABIC-FIRST-PHASE7.md).

---

## Arabic-first Phase 8 summary (AF8 — 2026-07-15)

Voice dock report with channel stamp + client lang hydrate. See [`ARABIC-FIRST-PHASE8.md`](ARABIC-FIRST-PHASE8.md).

### Unresolved after AF8

Voice report DB column; full LFG board; self-hosted fonts; remaining admin confirms EN.

---

## Arabic-first Phase 9 summary (AF9 — 2026-07-15)

Admin delete confirms localized. See [`ARABIC-FIRST-PHASE9.md`](ARABIC-FIRST-PHASE9.md).

---

## Arabic-first Phase 10 summary (AF10 — 2026-07-15)

`reports.voice_channel_id` + client/admin wiring. See [`ARABIC-FIRST-PHASE10.md`](ARABIC-FIRST-PHASE10.md).

### Migrations

`20260715260000_af10_report_voice_channel.sql` — apply per env.

### Unresolved after AF10

LFG events board; self-hosted fonts; voice participant picker; deeper SSR HTML strings.

---

## Arabic-first Phase 11 summary (AF11 — 2026-07-15)

In-hub LFG composer templates. See [`ARABIC-FIRST-PHASE11.md`](ARABIC-FIRST-PHASE11.md).

---

## Arabic-first Phase 12 summary (AF12 — 2026-07-15)

Voice report participant picker. See [`ARABIC-FIRST-PHASE12.md`](ARABIC-FIRST-PHASE12.md).

### Unresolved after AF12

Full LFG board; self-hosted fonts; deeper SSR shell strings; hubs/games `search_norm`; exhaustive logical CSS.

---

## Arabic-first Phase 13 summary (AF13 — 2026-07-15)

Catalog `name_search_norm` for hubs/games. See [`ARABIC-FIRST-PHASE13.md`](ARABIC-FIRST-PHASE13.md).

### Migrations

`20260715270000_af13_catalog_search_norm.sql` — apply per env.

---

## Arabic-first Phase 14 summary (AF14 — 2026-07-15)

High-traffic `ui/*` physical→logical CSS. See [`ARABIC-FIRST-PHASE14.md`](ARABIC-FIRST-PHASE14.md).

### Unresolved after AF14

Full LFG board; self-hosted fonts; deeper SSR shell strings; username search_norm; remaining route-level physical CSS.

---

## Arabic-first Phase 15 summary (AF15 — 2026-07-15)

Profile `username_search_norm` / `display_name_search_norm`. See [`ARABIC-FIRST-PHASE15.md`](ARABIC-FIRST-PHASE15.md).

### Migrations

`20260715280000_af15_profile_search_norm.sql` — apply per env.

---

## Arabic-first Phase 16 summary (AF16 — 2026-07-15)

Cookie / Accept-Language SSR for `<html lang dir>` + root meta. See [`ARABIC-FIRST-PHASE16.md`](ARABIC-FIRST-PHASE16.md).

### Unresolved after AF16

Full LFG board; self-hosted fonts; full React SSR of Arabic chrome strings; remaining route-level physical CSS.

---

## Arabic-first Phase 17 summary (AF17 — 2026-07-15)

Route/shell logical CSS. See [`ARABIC-FIRST-PHASE17.md`](ARABIC-FIRST-PHASE17.md).

---

## Arabic-first Phase 18 summary (AF18 — 2026-07-15)

Self-hosted Noto Sans Arabic via `@fontsource`. See [`ARABIC-FIRST-PHASE18.md`](ARABIC-FIRST-PHASE18.md).

### Unresolved after AF18

Full LFG board; self-host Latin fonts; full React SSR of Arabic chrome; remaining calendar/carousel/switch physics.

---

## Arabic-first Phase 19–22 (2026-07-15) — deferred mop-up

| Phase | Summary |
|-------|---------|
| AF19 | Thin LFG board from `#lfg` messages — [`ARABIC-FIRST-PHASE19.md`](ARABIC-FIRST-PHASE19.md) |
| AF20 | Self-host Inter + Space Grotesk; remove Google Fonts — [`ARABIC-FIRST-PHASE20.md`](ARABIC-FIRST-PHASE20.md) |
| AF21 | `LanguageProvider initialLang` + Accept-Language cookie set — [`ARABIC-FIRST-PHASE21.md`](ARABIC-FIRST-PHASE21.md) |
| AF22 | switch/calendar/carousel/settings logical CSS — [`ARABIC-FIRST-PHASE22.md`](ARABIC-FIRST-PHASE22.md) |

### Unresolved after AF22 (optional product, not Arabic-first blockers)

- Dedicated LFG events table / RSVP  
- Sidebar structural `data-side` physics (intentional)  
- Non–Arabic-first ops items from hardening phase summaries  

---

## Plan complete

Hardening Phases **0–18** are Done. Arabic-first **AF1–AF22** are Done; the Arabic-first deferred backlog from AF18 is closed. Remaining work: optional product follow-ups above + non–Arabic-first ops deferred items in each hardening summary. Open **AF23+** only with explicit approval.

Remaining work otherwise: deferred product/ops follow-ups listed in each hardening phase summary.
