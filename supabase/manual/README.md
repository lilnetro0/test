# supabase/manual/

Legacy **SQL Editor paste** scripts. Prefer `supabase/migrations/` for greenfield and CLI projects.

| File | Prefer migration |
|------|------------------|
| `01_backfill_profiles.sql` | Ops repair (also covered by `ensure_profile` migration + app ensure) |
| `02_phase3_friends_dms.sql` | `20260715030000_phase3_friends_dms.sql` |
| `03_phase4_notifications.sql` | `20260715040000_phase4_notifications.sql` |
| `04_phase6_launch.sql` | `20260715060000_phase6_launch.sql` |
| `05_security_hardening.sql` | `20260715070000_security_hardening.sql` |
| `06_mention_tag.sql` | `20260715080000_mention_tag.sql` |
| `07_storage.sql` | `20260715090000_storage_attachments.sql` |
| `08_admin_ops.sql` | `20260715100000_admin_ops.sql` |

See `docs/DATABASE-OPERATIONS.md`. After applying (or to audit a live project), run `supabase/verify_schema.sql`.
