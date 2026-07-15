-- MANUAL / LEGACY — prefer migrations/20260715070000_security_hardening.sql
-- See docs/DATABASE-OPERATIONS.md
-- Phase 7: security hardening (RLS + RPC)
-- Run after phases 3–6. Safe to re-run (idempotent drops/recreates).

-- ──────────────────────────────────────────────
-- Helpers
-- ──────────────────────────────────────────────
create or replace function public.is_banned(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_user_id and p.banned_at is not null
  );
$$;

create or replace function public.is_blocked_either(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocks bl
    where (bl.blocker_id = a and bl.blocked_id = b)
       or (bl.blocker_id = b and bl.blocked_id = a)
  );
$$;

-- Ban fields: clients cannot clear/set their own ban
create or replace function public.profiles_protect_ban_fields()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
    return new;
  end if;
  new.banned_at := old.banned_at;
  new.ban_reason := old.ban_reason;
  return new;
end;
$$;

drop trigger if exists profiles_protect_ban on public.profiles;
create trigger profiles_protect_ban
  before update on public.profiles
  for each row execute function public.profiles_protect_ban_fields();

-- Hub role: force member on join; ignore client role changes on update
create or replace function public.hub_members_protect_role()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.role := 'member';
    return new;
  end if;
  -- Preserve existing role (blocks self-escalation via upsert)
  new.role := old.role;
  return new;
end;
$$;

drop trigger if exists hub_members_protect_role on public.hub_members;
create trigger hub_members_protect_role
  before insert or update on public.hub_members
  for each row execute function public.hub_members_protect_role();

-- ──────────────────────────────────────────────
-- revoke notify_user from clients (triggers still work — security definer)
-- ──────────────────────────────────────────────
revoke all on function public.notify_user(uuid, text, text, text, text) from public;
revoke all on function public.notify_user(uuid, text, text, text, text) from anon;
revoke all on function public.notify_user(uuid, text, text, text, text) from authenticated;

-- ──────────────────────────────────────────────
-- Friendships: no client forge; only SECURITY DEFINER RPCs write
-- ──────────────────────────────────────────────
drop policy if exists "Users manage own friendships" on public.friendships;

-- ──────────────────────────────────────────────
-- Friend requests: only recipient updates status
-- ──────────────────────────────────────────────
drop policy if exists "Recipient updates friend requests" on public.friend_requests;
create policy "Recipient updates friend requests"
  on public.friend_requests for update to authenticated
  using (to_user_id = auth.uid() and not public.is_banned(auth.uid()))
  with check (to_user_id = auth.uid());

drop policy if exists "Sender cancels pending friend requests" on public.friend_requests;
create policy "Sender cancels pending friend requests"
  on public.friend_requests for delete to authenticated
  using (from_user_id = auth.uid() and status = 'pending');

drop policy if exists "Users create friend requests" on public.friend_requests;
create policy "Users create friend requests"
  on public.friend_requests for insert to authenticated
  with check (
    from_user_id = auth.uid()
    and not public.is_banned(auth.uid())
    and not public.is_blocked_either(from_user_id, to_user_id)
  );

-- Decline deletes the row so a new request can be sent later
create or replace function public.decline_friend_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if public.is_banned(me) then
    raise exception 'Account banned';
  end if;

  delete from public.friend_requests
  where id = p_request_id
    and to_user_id = me
    and status = 'pending';

  if not found then
    raise exception 'Friend request not found';
  end if;
end;
$$;

-- ──────────────────────────────────────────────
-- DMs: no client self-join; friendship + block checks
-- ──────────────────────────────────────────────
drop policy if exists "Users insert self as participant" on public.dm_participants;

create or replace function public.get_or_create_dm_thread(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  tid uuid;
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if public.is_banned(me) then
    raise exception 'Account banned';
  end if;
  if p_other_user_id = me then
    raise exception 'Cannot DM yourself';
  end if;
  if not exists (select 1 from public.profiles where id = p_other_user_id) then
    raise exception 'User not found';
  end if;
  if public.is_banned(p_other_user_id) then
    raise exception 'User unavailable';
  end if;
  if public.is_blocked_either(me, p_other_user_id) then
    raise exception 'Cannot DM this user';
  end if;
  if not public.are_friends(me, p_other_user_id) then
    raise exception 'Friends only';
  end if;

  select dp1.thread_id into tid
  from public.dm_participants dp1
  inner join public.dm_participants dp2 on dp1.thread_id = dp2.thread_id
  where dp1.user_id = me
    and dp2.user_id = p_other_user_id
  limit 1;

  if tid is not null then
    return tid;
  end if;

  insert into public.dm_threads default values
  returning id into tid;

  insert into public.dm_participants (thread_id, user_id)
  values
    (tid, me),
    (tid, p_other_user_id);

  return tid;
end;
$$;

-- ──────────────────────────────────────────────
-- Hub membership: join as member only; ban gate
-- ──────────────────────────────────────────────
drop policy if exists "Users can join hubs" on public.hub_members;
create policy "Users can join hubs"
  on public.hub_members for insert to authenticated
  with check (
    user_id = auth.uid()
    and role = 'member'
    and not public.is_banned(auth.uid())
  );

drop policy if exists "Users update own hub membership" on public.hub_members;
create policy "Users update own hub membership"
  on public.hub_members for update to authenticated
  using (user_id = auth.uid() and not public.is_banned(auth.uid()))
  with check (user_id = auth.uid());

-- ──────────────────────────────────────────────
-- Messages / DMs: ban gate
-- ──────────────────────────────────────────────
drop policy if exists "Members insert messages" on public.messages;
create policy "Members insert messages"
  on public.messages for insert to authenticated
  with check (
    author_id = auth.uid()
    and not public.is_banned(auth.uid())
    and public.is_hub_member(public.channel_hub_id(channel_id), auth.uid())
  );

drop policy if exists "Participants send dm messages" on public.dm_messages;
create policy "Participants send dm messages"
  on public.dm_messages for insert to authenticated
  with check (
    author_id = auth.uid()
    and not public.is_banned(auth.uid())
    and public.is_dm_participant(thread_id, auth.uid())
  );

drop policy if exists "Users create reports" on public.reports;
create policy "Users create reports"
  on public.reports for insert to authenticated
  with check (
    reporter_id = auth.uid()
    and not public.is_banned(auth.uid())
  );
