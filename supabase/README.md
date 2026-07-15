# supabase/

Canonical schema lives in **`migrations/`**. See **`docs/DATABASE-OPERATIONS.md`** for apply order, environments, and reset rules.

| Path | Class | Notes |
|------|--------|--------|
| `migrations/` | Canonical | Applied by `supabase db reset` / push |
| `seed.sql` | Seed | Catalog demo data (non-destructive) |
| `manual/01`–`08_*.sql` | Manual / legacy | Cloud SQL Editor catch-up; prefer matching migration |
| `00_reset_nexus.sql` | Stub | Blocked — does not wipe |
| `dangerous/00_reset_nexus.sql` | Dangerous | Guarded wipe; local/empty only |
| `verify_schema.sql` | Audit | Read-only inventory for each live project |
| `config.toml` | Local CLI | Docker ports, seed path |

**Never** run `dangerous/*` against production.
