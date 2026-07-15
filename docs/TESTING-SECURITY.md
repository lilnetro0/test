# Testing & security verification — Nexus

**Phase:** 17 (+ follow-up)  
**Date:** 2026-07-15

## Commands (CI gates)

| Script | Purpose |
|--------|---------|
| `npm test` | Vitest unit tests (pure lib utils) |
| `npm run typecheck` | Scoped `tsc -p tsconfig.ci.json` |
| `npm run typecheck:full` | Full `src` typecheck (**green** after P17f) |
| `npm run smoke:security` | CSRF / headers / prod asserts / secret leaks / RLS artifacts / `npm audit` high+ |
| `npm run lint:ci` | ESLint without Prettier (`eslint.ci.config.js`) |
| `npm run ci:verify` | test + both typechecks + smoke:security + lint:ci |
| `npm run format` / `format:check` | Prettier write / narrow check (style not a merge blocker) |

Codemagic `web-smoke` runs: **test → typecheck → typecheck:full → smoke:security → lint:ci → smoke:launch → build → cap:smoke → ops:health**.

## What’s covered by unit tests

- Rate-limit error mapping (`rate-limit.ts`)
- Storage MIME / path / size / attachment refs (`storage-policy.ts`)
- Hub capability + kick hierarchy (`hub/permissions.ts`)
- Report reason allowlist (`trust-safety.ts`)
- `ADMIN_USER_IDS` CSV parse (`admin/authz.ts` → `parseAdminIds`)
- Prod fail-closed client env (`supabase/env.ts`)

## Security verification (automated)

1. `createCsrfMiddleware` in `src/start.ts`
2. Security headers + CSP in `src/server.ts`
3. `assertProductionClientEnv` / `assertProductionServerEnv` + `__root` wire-up
4. No `VITE_SUPABASE_SERVICE_ROLE` / `VITE_ADMIN_USER_IDS` / etc. in `src`
5. RLS enable + `verify_schema.sql` coverage asserted in-repo
6. `npm audit` high+ = fail
7. Dependabot weekly PRs (`.github/dependabot.yml`)

## Manual / ops (still human)

- Run `supabase/verify_schema.sql` on each **live** project (RLS inventory against real DB)
- Two-account spot-check: messages/DMs/notifications scoped to members (LAUNCH.md)
- Playwright browser E2E against staging (not in repo — needs deploy URL + test users)

## Database types note

Hand-written `src/lib/supabase/types.ts` includes `Relationships` for embeds (hubs↔games, messages/DMs↔profiles, reports↔profiles), friend/DM RPCs, empty Views/Enums/CompositeTypes. Prefer `supabase gen types` long-term.

## Still deferred

- Playwright / live DB integration suite (needs staging credentials)
- Full Prettier as a CI merge gate (use `format` locally; `lint:ci` is the blocker)
- Malware/AV pipeline for storage
