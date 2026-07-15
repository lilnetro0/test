-- =============================================================================
-- DESTRUCTIVE — LOCAL / EMPTY PROJECTS ONLY
-- Location: supabase/dangerous/00_reset_nexus.sql
-- NEVER run against staging or production.
--
-- Safety gate (must run in the same SQL Editor session first):
--   select set_config('nexus.allow_destructive_reset', 'I_UNDERSTAND', true);
-- Then paste and run this entire file.
-- =============================================================================

do $$
begin
  if current_setting('nexus.allow_destructive_reset', true) is distinct from 'I_UNDERSTAND' then
    raise exception
      'BLOCKED: Nexus destructive reset. This drops all public Nexus tables. For empty/local repair only. In the SAME session run: select set_config(''nexus.allow_destructive_reset'', ''I_UNDERSTAND'', true); then re-run this script. Do NOT use on production.';
  end if;
end $$;

-- Does NOT delete auth.users (logins stay).

drop trigger if exists on_auth_user_created on auth.users;

drop table if exists public.message_reactions cascade;
drop table if exists public.messages cascade;
drop table if exists public.dm_messages cascade;
drop table if exists public.dm_participants cascade;
drop table if exists public.dm_threads cascade;
drop table if exists public.notifications cascade;
drop table if exists public.friend_requests cascade;
drop table if exists public.friendships cascade;
drop table if exists public.blocks cascade;
drop table if exists public.hub_members cascade;
drop table if exists public.text_channels cascade;
drop table if exists public.voice_channels cascade;
drop table if exists public.hubs cascade;
drop table if exists public.games cascade;
drop table if exists public.user_prefs cascade;
drop table if exists public.profiles cascade;
drop table if exists public.reports cascade;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_updated_at() cascade;
drop function if exists public.is_hub_member(uuid, uuid) cascade;
drop function if exists public.channel_hub_id(uuid) cascade;
drop function if exists public.is_dm_participant(uuid, uuid) cascade;
drop function if exists public.are_friends(uuid, uuid) cascade;

-- Next (local CLI preferred): npx supabase db reset
-- Or (SQL Editor): apply migrations/20260715000000_nexus_core.sql then seed.sql
-- See docs/DATABASE-OPERATIONS.md
