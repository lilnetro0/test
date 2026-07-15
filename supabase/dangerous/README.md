# supabase/dangerous/

Scripts here can destroy data.

| File | Gate |
|------|------|
| `00_reset_nexus.sql` | Requires `set_config('nexus.allow_destructive_reset', 'I_UNDERSTAND', true)` in the **same** SQL session |

**Forbidden** on staging/production with real user data. See `docs/DATABASE-OPERATIONS.md`.
