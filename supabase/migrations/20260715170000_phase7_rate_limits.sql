-- Phase 7 — rate limiting for chat, reports, friend requests
-- Enforced on INSERT (browser → PostgREST). service_role skips.

create index if not exists messages_author_created_idx
  on public.messages (author_id, created_at desc);

create index if not exists dm_messages_author_created_idx
  on public.dm_messages (author_id, created_at desc);

create index if not exists friend_requests_from_created_idx
  on public.friend_requests (from_user_id, created_at desc);

create or replace function public.raise_rate_limited(p_scope text)
returns void
language plpgsql
immutable
as $$
begin
  raise exception 'rate_limited:%', p_scope
    using errcode = 'P0001';
end;
$$;

-- ---------------------------------------------------------------------------
-- Channel messages: 5 / 5s burst, 40 / 60s
-- ---------------------------------------------------------------------------
create or replace function public.messages_enforce_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  burst int;
  minute int;
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  select count(*) into burst
  from public.messages m
  where m.author_id = new.author_id
    and m.created_at > now() - interval '5 seconds';

  if burst >= 5 then
    perform public.raise_rate_limited('channel_burst');
  end if;

  select count(*) into minute
  from public.messages m
  where m.author_id = new.author_id
    and m.created_at > now() - interval '60 seconds';

  if minute >= 40 then
    perform public.raise_rate_limited('channel_minute');
  end if;

  return new;
end;
$$;

drop trigger if exists messages_enforce_rate_limit on public.messages;
create trigger messages_enforce_rate_limit
  before insert on public.messages
  for each row
  execute function public.messages_enforce_rate_limit();

-- ---------------------------------------------------------------------------
-- DM messages: 5 / 5s burst, 30 / 60s
-- ---------------------------------------------------------------------------
create or replace function public.dm_messages_enforce_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  burst int;
  minute int;
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  select count(*) into burst
  from public.dm_messages m
  where m.author_id = new.author_id
    and m.created_at > now() - interval '5 seconds';

  if burst >= 5 then
    perform public.raise_rate_limited('dm_burst');
  end if;

  select count(*) into minute
  from public.dm_messages m
  where m.author_id = new.author_id
    and m.created_at > now() - interval '60 seconds';

  if minute >= 30 then
    perform public.raise_rate_limited('dm_minute');
  end if;

  return new;
end;
$$;

drop trigger if exists dm_messages_enforce_rate_limit on public.dm_messages;
create trigger dm_messages_enforce_rate_limit
  before insert on public.dm_messages
  for each row
  execute function public.dm_messages_enforce_rate_limit();

-- ---------------------------------------------------------------------------
-- Reports: 10 / hour overall; 3 / day per target (user or message)
-- ---------------------------------------------------------------------------
create or replace function public.reports_enforce_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  hourly int;
  daily_same int;
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  select count(*) into hourly
  from public.reports r
  where r.reporter_id = new.reporter_id
    and r.created_at > now() - interval '1 hour';

  if hourly >= 10 then
    perform public.raise_rate_limited('report_hour');
  end if;

  if new.message_id is not null then
    select count(*) into daily_same
    from public.reports r
    where r.reporter_id = new.reporter_id
      and r.message_id = new.message_id
      and r.created_at > now() - interval '1 day';
  elsif new.target_user_id is not null then
    select count(*) into daily_same
    from public.reports r
    where r.reporter_id = new.reporter_id
      and r.target_user_id = new.target_user_id
      and r.message_id is null
      and r.created_at > now() - interval '1 day';
  else
    daily_same := 0;
  end if;

  if daily_same >= 3 then
    perform public.raise_rate_limited('report_target_day');
  end if;

  return new;
end;
$$;

drop trigger if exists reports_enforce_rate_limit on public.reports;
create trigger reports_enforce_rate_limit
  before insert on public.reports
  for each row
  execute function public.reports_enforce_rate_limit();

-- ---------------------------------------------------------------------------
-- Friend requests: 20 / day from a user
-- ---------------------------------------------------------------------------
create or replace function public.friend_requests_enforce_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  daily int;
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  select count(*) into daily
  from public.friend_requests fr
  where fr.from_user_id = new.from_user_id
    and fr.created_at > now() - interval '1 day';

  if daily >= 20 then
    perform public.raise_rate_limited('friend_day');
  end if;

  return new;
end;
$$;

drop trigger if exists friend_requests_enforce_rate_limit on public.friend_requests;
create trigger friend_requests_enforce_rate_limit
  before insert on public.friend_requests
  for each row
  execute function public.friend_requests_enforce_rate_limit();

comment on function public.raise_rate_limited(text) is
  'Raise parseable rate_limited:<scope> for client UX mapping.';
