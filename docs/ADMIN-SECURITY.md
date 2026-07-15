# Admin security (Phase 3)

## Auth model

| Layer | Role |
|-------|------|
| **Durable** | `public.platform_roles` (`role = platform_admin`) |
| **Bootstrap / break-glass** | Server-only `ADMIN_USER_IDS` (comma UUIDs, never `VITE_*`) |
| **Gate** | `requireAdmin` in `src/lib/admin/authz.ts` |
| **Mutations** | Service role via `getSupabaseAdminClient()` after gate (RLS bypass — intentional for now) |
| **Audit** | `public.admin_audit_log` append-only |

Hub roles (`hub_members.admin|mod|member`) are **not** platform admin.

## Access check

1. Valid JWT.
2. Row in `platform_roles` for that user → allow.
3. Else if UUID in `ADMIN_USER_IDS` → allow and **upsert** `platform_roles` (bootstrap) + audit `platform_role.bootstrap`.
4. Else forbid.

Clients can `SELECT` their own `platform_roles` row only. They cannot insert/update/delete roles or write the audit log.

## Apply migration

```text
supabase/migrations/20260715130000_phase3_platform_roles.sql
```

Optional one-time SQL (instead of waiting for bootstrap login):

```sql
insert into public.platform_roles (user_id, role)
values ('YOUR-AUTH-USER-UUID', 'platform_admin')
on conflict (user_id) do nothing;
```

## Ops notes

- Grant/revoke platform admins in `/admin` → **Users** (or SQL below).
- Keep `ADMIN_USER_IDS` as empty-or-break-glass after bootstrap if desired; DB remains source of truth.
- Do not grant broad JWT RLS that lets platform admins UPDATE all tables — keep god-mode on server fns + service role (**intentional** until a future narrow-path phase).
- Single role `platform_admin` only for now (**intentional**); hub-level matrix is Phase 4 (`docs/HUB-PERMISSIONS.md`).
- Revoke: cannot remove the last platform admin if that row is yourself.
- Revoke via UI or: `delete from public.platform_roles where user_id = '…';` and remove from env.

## Intentional non-goals (Phase 3)

| Topic | Stance |
|-------|--------|
| Service-role mutations | Keep — app gate + service role; do not open table-wide JWT RLS for convenience |
| Multiple platform role kinds | Deferred — only `platform_admin` |
| Hub permission matrix | Phase 4 |

See `docs/PRODUCTION-HARDENING-PLAN.md` Phase 3.
