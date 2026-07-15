-- =============================================================================
-- STUB — this file no longer performs a reset.
-- The destructive script lives at:
--   supabase/dangerous/00_reset_nexus.sql
-- with an explicit session safety gate.
-- See docs/DATABASE-OPERATIONS.md
-- =============================================================================

do $$
begin
  raise exception
    'Nexus reset moved to supabase/dangerous/00_reset_nexus.sql (guarded). Do not run resets against production. See docs/DATABASE-OPERATIONS.md';
end $$;
