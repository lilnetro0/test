-- =============================================================================
-- STEP 1/3 — Reset half-applied Nexus schema (SQL Editor)
-- Run this FIRST if you saw:
--   - relation "profiles" already exists
--   - column "short" of relation "games" does not exist
-- Does NOT delete auth.users (your logins stay).
-- =============================================================================

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

drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_updated_at() cascade;
drop function if exists public.is_hub_member(uuid, uuid) cascade;
drop function if exists public.channel_hub_id(uuid) cascade;
drop function if exists public.is_dm_participant(uuid, uuid) cascade;
drop function if exists public.are_friends(uuid, uuid) cascade;

-- Done. Next: run migrations/20260715000000_nexus_core.sql
-- Then: run seed.sql
