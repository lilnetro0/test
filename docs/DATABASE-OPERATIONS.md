# Database operations — Nexus

**Audience:** operators applying schema to local, staging, or production Supabase.  
**Rule:** never run a destructive reset against staging or production.

---

## Classification

| Path | Role | When to use |
|------|------|-------------|
| `supabase/migrations/*.sql` | **Canonical schema** | Local CLI (`db reset` / `db push`) and forward-only production changes |
| `supabase/seed.sql` | Non-destructive demo catalog | After core schema; empty catalog only |
| `supabase/manual/01`–`08_*.sql` | **Manual / legacy cloud paste** | Catch-up for projects that never used CLI; prefer equivalent migration if already applied |
| `supabase/00_reset_nexus.sql` | Stub (blocked) | Redirects to guarded reset |
| `supabase/dangerous/00_reset_nexus.sql` | **Destructive reset** | Empty/local repair only — session gate required |
| `supabase/verify_schema.sql` | Read-only audit | Run on each live project to inventory gaps |
| `supabase/config.toml` | Local Supabase CLI config | `npx supabase start` |

Manual scripts **mirror** (or partially overlap) timestamped migrations. Do not assume paste order equals migration history on every cloud project.

---

## Environments

| Env | Prefer | Reset allowed? |
|-----|--------|----------------|
| Local Docker (`supabase start`) | `npx supabase db reset` | Yes |
| Shared staging | Migrations / CLI push; manual paste only if documented | No wipe of shared data |
| Production | Forward-only new migration files | **Never** |

Track applied migration versions in Supabase Dashboard → Database → Migrations (CLI) or keep an operator checklist when using SQL Editor paste. Always re-check with `verify_schema.sql` after changes.

---

## Live project inventory

The repo cannot know remote Supabase state. For **each** of dev / staging / prod:

1. Open SQL Editor on that project.
2. Paste and run [`supabase/verify_schema.sql`](../supabase/verify_schema.sql).
3. Record results (or screenshot) next to the env name in your ops notes.
4. Any row with `status = MISSING` means that phase was never applied — paste the matching file under `migrations/` (or `manual/` for legacy) and re-run verify until clean.
5. Optional (CLI projects only): uncomment / run  
   `select version from supabase_migrations.schema_migrations order by version;`  
   Compare to the migration list in `supabase/migrations/README.md`.

**Expected baseline** after a full apply through `20260715221000_phase12_followup_voice_mint_limit.sql`: zero `MISSING` rows for tables, columns, functions, and the three storage buckets (`avatars`, `attachments`, `hub-media`).

---

## Apply order

### A. Preferred — local CLI

```bash
npx supabase start
npx supabase db reset   # migrations/* then seed.sql
```

### B. Cloud SQL Editor (greenfield / half-applied)

1. **Do not** run reset on a project with real users/data.
2. If the project is empty or local repair only: open `supabase/dangerous/00_reset_nexus.sql`, set the session gate, then run it.
3. Paste **one file per query**, in timestamp order under `supabase/migrations/`:
   - `20260715000000_nexus_core.sql`
   - `20260715010000_phase2_hub_member_upsert.sql` (skip if already in your core)
   - `20260715020000_ensure_profile.sql`
   - `20260715030000_phase3_friends_dms.sql`
   - `20260715040000_phase4_notifications.sql`
   - `20260715060000_phase6_launch.sql`
   - `20260715070000_security_hardening.sql`
   - `20260715080000_mention_tag.sql`
   - `20260715090000_storage_attachments.sql`
   - `20260715100000_admin_ops.sql`
   - `20260715120000_phase2_catalog_hubs.sql` (official hubs for remaining catalog games)
   - `20260715130000_phase3_platform_roles.sql` (platform admin roles + audit log)
   - `20260715140000_phase4_hub_roles.sql` (hub mod permissions + kick/role RPCs)
   - `20260715141000_phase4_founder_audit.sql` (founder promote + hub mod audit)
   - `20260715150000_phase5_messages_reliability.sql` (soft-delete + live message indexes)
   - `20260715151000_phase5_followup_edits_dms_pagination.sql` (edit history + DM soft-delete)
   - `20260715160000_phase6_read_state_presence.sql` (read cursors + presence)
   - `20260715161000_phase6_followup_unread_totals.sql` (dock unread totals)
   - `20260715170000_phase7_rate_limits.sql` (chat/report/friend rate triggers)
   - `20260715171000_phase7_followup_edit_reaction_limits.sql` (edit + reaction rate triggers)
   - `20260715180000_phase8_storage_security.sql` (storage MIME/size + attachment mime CHECKs)
   - `20260715181000_phase8_followup_private_attachments.sql` (private attachments + quota RPC)
   - `20260715190000_phase9_trust_safety.sql` (reports depth + DM block gate)
   - `20260715191000_phase9_followup_blocks_reports.sql` (visible hub roster + report harden)
   - `20260715200000_phase10_account_lifecycle.sql` (account_deletion_log)
   - `20260715210000_phase11_push_devices.sql` (push_devices + push_enabled)
   - `20260715211000_phase11_followup_notif_prefs.sql` (sound / mentions / DND prefs)
   - `20260715221000_phase12_followup_voice_mint_limit.sql` (voice mint rate limit)
4. Run `supabase/seed.sql` only if catalog tables are empty.
5. Optional catch-up: `manual/01_backfill_profiles.sql` if auth users exist without profiles after a reset.
6. Run `verify_schema.sql` and fix any `MISSING` rows.

Legacy files under `manual/` (`02`–`08`) are the same phases as the migrations above; use migrations when both exist.

---

## Destructive reset (local / empty only)

1. Confirm the target project has **no** production data you care about.
2. In SQL Editor, same session:

```sql
select set_config('nexus.allow_destructive_reset', 'I_UNDERSTAND', true);
```

3. Run the full contents of `supabase/dangerous/00_reset_nexus.sql`.
4. Re-apply migrations (+ seed as needed).
5. Run `verify_schema.sql`.

`supabase/00_reset_nexus.sql` is a **stub** that only raises an exception pointing here. Auth users (`auth.users`) are **not** deleted by the dangerous script; profiles are — run `manual/01_backfill_profiles.sql` or re-login ensure-profile after.

---

## New schema changes (going forward)

1. Add a new file under `supabase/migrations/` with timestamp prefix `YYYYMMDDHHMMSS_name.sql`.
2. Prefer `IF NOT EXISTS` / additive alters; avoid drop-and-recreate of live tables.
3. Extend `verify_schema.sql` if you add required tables/columns/functions/buckets.
4. Document the change in the PR / phase notes.
5. Apply to staging first; verify; then production.
6. Do **not** edit old migrations that may already be applied on a live project (add a new migration instead).

Optional: keep a short note in `BACKEND.md` when operators still use SQL Editor paste.

---

## Rollback stance

- **Preferred:** forward-fix migration (new file) that undoes or corrects the change.
- **Not supported:** `db reset` or dangerous wipe on production.
- Table drops / data deletes require an explicit operator decision and backup awareness (Supabase PITR / dump) outside this repo.

---

## Quick verification

After apply:

1. Run `supabase/verify_schema.sql` — no `MISSING`.
2. Auth signup creates a `profiles` row.
3. App with `VITE_SUPABASE_*` set shows **no** demo banner (`shouldUseMockData` false).
4. Production builds must not set `VITE_USE_MOCK` (client throws).
5. Production server must set `SUPABASE_SERVICE_ROLE_KEY` (admin client throws if missing).

---

## Related

- `supabase/README.md` — folder map
- `BACKEND.md` — product/backend wiring overview
- `docs/PRODUCTION-HARDENING-PLAN.md` — Phase 1
