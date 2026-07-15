-- Phase 6 — channel read cursors, DM last_read wiring, presence last_seen
-- Unread badges use last_read_at; dock notifications remain separate.

-- ---------------------------------------------------------------------------
-- Channel member read state
-- ---------------------------------------------------------------------------
create table if not exists public.channel_member_states (
  channel_id uuid not null references public.text_channels (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default 'epoch'::timestamptz,
  primary key (channel_id, user_id)
);

create index if not exists channel_member_states_user_idx
  on public.channel_member_states (user_id);

alter table public.channel_member_states enable row level security;

drop policy if exists "Members read own channel states" on public.channel_member_states;
create policy "Members read own channel states"
  on public.channel_member_states for select to authenticated
  using (
    user_id = auth.uid()
    and public.is_hub_member(public.channel_hub_id(channel_id), auth.uid())
  );

drop policy if exists "Members upsert own channel states" on public.channel_member_states;
create policy "Members upsert own channel states"
  on public.channel_member_states for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.is_hub_member(public.channel_hub_id(channel_id), auth.uid())
  );

drop policy if exists "Members update own channel states" on public.channel_member_states;
create policy "Members update own channel states"
  on public.channel_member_states for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.is_hub_member(public.channel_hub_id(channel_id), auth.uid())
  );

-- DM participants: allow updating own last_read_at
drop policy if exists "Users update own dm participant" on public.dm_participants;
create policy "Users update own dm participant"
  on public.dm_participants for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Mark-read RPCs
-- ---------------------------------------------------------------------------
create or replace function public.mark_channel_read(p_channel_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  hub uuid;
begin
  if actor is null then
    raise exception 'Not authenticated';
  end if;
  hub := public.channel_hub_id(p_channel_id);
  if hub is null or not public.is_hub_member(hub, actor) then
    raise exception 'Not a hub member';
  end if;

  insert into public.channel_member_states (channel_id, user_id, last_read_at)
  values (p_channel_id, actor, now())
  on conflict (channel_id, user_id)
  do update set last_read_at = greatest(public.channel_member_states.last_read_at, excluded.last_read_at);
end;
$$;

revoke all on function public.mark_channel_read(uuid) from public;
grant execute on function public.mark_channel_read(uuid) to authenticated, service_role;

create or replace function public.mark_dm_read(p_thread_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_dm_participant(p_thread_id, actor) then
    raise exception 'Not a participant';
  end if;

  update public.dm_participants
  set last_read_at = now()
  where thread_id = p_thread_id
    and user_id = actor;
end;
$$;

revoke all on function public.mark_dm_read(uuid) from public;
grant execute on function public.mark_dm_read(uuid) to authenticated, service_role;

-- Unread counts per text channel in a hub (capped conceptually in app).
create or replace function public.hub_channel_unreads(p_hub_id uuid)
returns table (channel_id uuid, unread bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then
    return;
  end if;
  if not public.is_hub_member(p_hub_id, actor) then
    return;
  end if;

  return query
  select
    c.id as channel_id,
    (
      select count(*)::bigint
      from public.messages m
      where m.channel_id = c.id
        and m.deleted_at is null
        and m.author_id is distinct from actor
        and m.created_at > coalesce(s.last_read_at, 'epoch'::timestamptz)
    ) as unread
  from public.text_channels c
  left join public.channel_member_states s
    on s.channel_id = c.id and s.user_id = actor
  where c.hub_id = p_hub_id;
end;
$$;

revoke all on function public.hub_channel_unreads(uuid) from public;
grant execute on function public.hub_channel_unreads(uuid) to authenticated, service_role;

-- DM unread for current user in a thread
create or replace function public.dm_thread_unread(p_thread_id uuid)
returns bigint
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  cursor timestamptz;
begin
  if actor is null or not public.is_dm_participant(p_thread_id, actor) then
    return 0;
  end if;

  select dp.last_read_at into cursor
  from public.dm_participants dp
  where dp.thread_id = p_thread_id and dp.user_id = actor;

  return (
    select count(*)::bigint
    from public.dm_messages m
    where m.thread_id = p_thread_id
      and m.deleted_at is null
      and m.author_id is distinct from actor
      and m.created_at > coalesce(cursor, 'epoch'::timestamptz)
  );
end;
$$;

revoke all on function public.dm_thread_unread(uuid) from public;
grant execute on function public.dm_thread_unread(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Presence: last_seen_at + allowlist status values
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists last_seen_at timestamptz;

create or replace function public.set_presence(p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  cleaned text := lower(trim(coalesce(p_status, '')));
begin
  if actor is null then
    raise exception 'Not authenticated';
  end if;
  if cleaned not in ('online', 'idle', 'dnd', 'offline') then
    raise exception 'Invalid presence status';
  end if;

  update public.profiles
  set
    status = cleaned,
    last_seen_at = case when cleaned = 'offline' then last_seen_at else now() end,
    updated_at = now()
  where id = actor;
end;
$$;

revoke all on function public.set_presence(text) from public;
grant execute on function public.set_presence(text) to authenticated, service_role;

-- Live-ish active_count from online/idle/dnd hub members (display string).
create or replace function public.refresh_hub_active_count(p_hub_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  n bigint;
  label text;
begin
  select count(*) into n
  from public.hub_members hm
  join public.profiles p on p.id = hm.user_id
  where hm.hub_id = p_hub_id
    and p.status is distinct from 'offline';

  label := n::text;
  update public.hubs set active_count = label where id = p_hub_id;
  return label;
end;
$$;

revoke all on function public.refresh_hub_active_count(uuid) from public;
grant execute on function public.refresh_hub_active_count(uuid) to authenticated, service_role;

comment on table public.channel_member_states is
  'Per-user last_read_at for hub text channels (Phase 6).';
comment on function public.mark_channel_read(uuid) is
  'Advance channel read cursor for the caller.';
comment on function public.mark_dm_read(uuid) is
  'Advance DM thread read cursor for the caller.';
comment on function public.set_presence(text) is
  'Set profiles.status to online|idle|dnd|offline and bump last_seen_at.';
