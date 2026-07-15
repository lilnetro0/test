-- =============================================================================
-- MANUAL / LEGACY — prefer migrations/20260715040000_phase4_notifications.sql
-- See docs/DATABASE-OPERATIONS.md
-- Phase 4 — Notification triggers (SQL Editor)
-- Requires: core schema (+ Phase 3 RPCs recommended).
-- Safe to re-run (create or replace + drop/create triggers).
-- =============================================================================

create or replace function public.notify_user(
  p_user_id uuid,
  p_kind text,
  p_title text,
  p_body text,
  p_href text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  nid uuid;
begin
  if p_user_id is null then
    return null;
  end if;
  if p_kind not in ('mention', 'friend', 'voice', 'system', 'dm') then
    raise exception 'Invalid notification kind';
  end if;

  insert into public.notifications (user_id, kind, title, body, href)
  values (p_user_id, p_kind, p_title, coalesce(p_body, ''), p_href)
  returning id into nid;

  return nid;
end;
$$;

create or replace function public.trg_friend_request_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  from_name text;
begin
  if new.status <> 'pending' then
    return new;
  end if;

  select username into from_name from public.profiles where id = new.from_user_id;
  perform public.notify_user(
    new.to_user_id,
    'friend',
    'New friend request',
    coalesce(from_name, 'Someone') || ' wants to be your friend',
    '/friends'
  );
  return new;
end;
$$;

drop trigger if exists friend_request_notify on public.friend_requests;
create trigger friend_request_notify
  after insert on public.friend_requests
  for each row execute function public.trg_friend_request_notify();

create or replace function public.trg_friend_accept_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  to_name text;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;
  if old.status = 'pending' and new.status = 'accepted' then
    select username into to_name from public.profiles where id = new.to_user_id;
    perform public.notify_user(
      new.from_user_id,
      'friend',
      'Friend request accepted',
      coalesce(to_name, 'Someone') || ' accepted your friend request',
      '/friends'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists friend_accept_notify on public.friend_requests;
create trigger friend_accept_notify
  after update of status on public.friend_requests
  for each row execute function public.trg_friend_accept_notify();

create or replace function public.trg_dm_message_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  author_name text;
  recip uuid;
  preview text;
begin
  select username into author_name from public.profiles where id = new.author_id;
  preview := left(new.body, 120);

  for recip in
    select user_id
    from public.dm_participants
    where thread_id = new.thread_id
      and user_id <> new.author_id
  loop
    perform public.notify_user(
      recip,
      'dm',
      'New message from ' || coalesce(author_name, 'Someone'),
      preview,
      '/dm?thread=' || new.thread_id::text
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists dm_message_notify on public.dm_messages;
create trigger dm_message_notify
  after insert on public.dm_messages
  for each row execute function public.trg_dm_message_notify();

create or replace function public.trg_message_mention_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  author_name text;
  channel_name text;
  hub_uuid uuid;
  mention text;
  mentioned_id uuid;
  preview text;
begin
  select username into author_name from public.profiles where id = new.author_id;
  select name, hub_id into channel_name, hub_uuid
  from public.text_channels
  where id = new.channel_id;

  preview := left(new.body, 120);

  for mention in
    select distinct x[1]
    from regexp_matches(new.body, '@([A-Za-z0-9_]{2,32})', 'g') as x
  loop
    mentioned_id := null;
    select p.id into mentioned_id
    from public.profiles p
    where lower(p.username) = lower(mention)
    limit 1;

    if mentioned_id is null or mentioned_id = new.author_id then
      continue;
    end if;

    if hub_uuid is null or not public.is_hub_member(hub_uuid, mentioned_id) then
      continue;
    end if;

    perform public.notify_user(
      mentioned_id,
      'mention',
      '@' || mention || ' in #' || coalesce(channel_name, 'channel'),
      coalesce(author_name, 'Someone') || ': ' || preview,
      '/'
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists message_mention_notify on public.messages;
create trigger message_mention_notify
  after insert on public.messages
  for each row execute function public.trg_message_mention_notify();

grant execute on function public.notify_user(uuid, text, text, text, text) to authenticated;
