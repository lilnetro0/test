-- Mentions notify only on exact @Username#1234 (avoids wrong-user collisions).
-- Run after Phase 4. Same as migrations/20260715080000_mention_tag.sql

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
  mentioned_id uuid;
  preview text;
  rec record;
begin
  select username into author_name from public.profiles where id = new.author_id;
  select name, hub_id into channel_name, hub_uuid
  from public.text_channels
  where id = new.channel_id;

  preview := left(new.body, 120);

  for rec in
    select distinct m[1] as mention_user, m[2] as mention_tag
    from regexp_matches(new.body, '@([A-Za-z0-9_]{2,32})#([0-9]{4})', 'g') as m
  loop
    mentioned_id := null;
    select p.id into mentioned_id
    from public.profiles p
    where lower(p.username) = lower(rec.mention_user)
      and p.tag = rec.mention_tag
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
      '@' || rec.mention_user || '#' || rec.mention_tag || ' in #' || coalesce(channel_name, 'channel'),
      coalesce(author_name, 'Someone') || ': ' || preview,
      '/'
    );
  end loop;

  return new;
end;
$$;
