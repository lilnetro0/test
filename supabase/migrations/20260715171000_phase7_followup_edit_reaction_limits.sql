-- Phase 7 follow-up — edit + reaction rate limits

create index if not exists message_edits_editor_created_idx
  on public.message_edits (editor_id, created_at desc);

create index if not exists message_reactions_user_created_idx
  on public.message_reactions (user_id, created_at desc);

-- Edits: 3 / 5s, 10 / 60s (counted via message_edits history for this editor)
create or replace function public.messages_enforce_edit_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  burst int;
  minute int;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;
  -- Soft-delete / non-body updates are not edits
  if new.deleted_at is not null or old.body is not distinct from new.body then
    return new;
  end if;
  if actor is null then
    return new;
  end if;

  select count(*) into burst
  from public.message_edits e
  where e.editor_id = actor
    and e.created_at > now() - interval '5 seconds';

  if burst >= 3 then
    perform public.raise_rate_limited('edit_burst');
  end if;

  select count(*) into minute
  from public.message_edits e
  where e.editor_id = actor
    and e.created_at > now() - interval '60 seconds';

  if minute >= 10 then
    perform public.raise_rate_limited('edit_minute');
  end if;

  return new;
end;
$$;

drop trigger if exists messages_enforce_edit_rate_limit on public.messages;
create trigger messages_enforce_edit_rate_limit
  before update of body on public.messages
  for each row
  execute function public.messages_enforce_edit_rate_limit();

-- Reactions (INSERT only): 8 / 5s, 40 / 60s
create or replace function public.message_reactions_enforce_rate_limit()
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
  from public.message_reactions r
  where r.user_id = new.user_id
    and r.created_at > now() - interval '5 seconds';

  if burst >= 8 then
    perform public.raise_rate_limited('reaction_burst');
  end if;

  select count(*) into minute
  from public.message_reactions r
  where r.user_id = new.user_id
    and r.created_at > now() - interval '60 seconds';

  if minute >= 40 then
    perform public.raise_rate_limited('reaction_minute');
  end if;

  return new;
end;
$$;

drop trigger if exists message_reactions_enforce_rate_limit on public.message_reactions;
create trigger message_reactions_enforce_rate_limit
  before insert on public.message_reactions
  for each row
  execute function public.message_reactions_enforce_rate_limit();

comment on function public.messages_enforce_edit_rate_limit() is
  'Rate-limit channel message body edits (Phase 7 follow-up).';
comment on function public.message_reactions_enforce_rate_limit() is
  'Rate-limit reaction inserts (Phase 7 follow-up).';
