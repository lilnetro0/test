-- Arabic-first Phase 4: DB-normalized Arabic search for messages / DMs
-- Mirror of src/lib/arabic-normalize.ts — keep in sync when changing fold rules.
-- Moderators must still see original `body`; this column is search-only.

create extension if not exists pg_trgm;

create or replace function public.normalize_arabic_for_search(p_input text)
returns text
language plpgsql
immutable
parallel safe
as $$
declare
  s text := coalesce(p_input, '');
begin
  -- NFKC
  s := normalize(s, NFKC);
  -- Tatweel
  s := replace(s, U&'\0640', '');
  -- Combining Arabic diacritics + common Quranic marks
  s := regexp_replace(s, U&'[\064B-\065F\0670\06D6-\06ED]', '', 'g');
  -- Alef variants → ا
  s := translate(s, U&'\0623\0625\0622\0671', U&'\0627\0627\0627\0627');
  -- Yeh / alef maqsura
  s := replace(s, U&'\0649', U&'\064A');
  -- Teh marbuta → heh (search fold only)
  s := replace(s, U&'\0629', U&'\0647');
  -- Arabic-Indic digits → Western
  s := translate(
    s,
    U&'\0660\0661\0662\0663\0664\0665\0666\0667\0668\0669',
    '0123456789'
  );
  return lower(s);
end;
$$;

comment on function public.normalize_arabic_for_search(text) is
  'AF4 search fold — must stay aligned with src/lib/arabic-normalize.ts';

alter table public.messages
  add column if not exists body_search_norm text;

alter table public.dm_messages
  add column if not exists body_search_norm text;

comment on column public.messages.body_search_norm is
  'Normalized body for Arabic/Latin search only; UI always displays body.';

comment on column public.dm_messages.body_search_norm is
  'Normalized body for Arabic/Latin search only; UI always displays body.';

create or replace function public.tg_set_body_search_norm()
returns trigger
language plpgsql
as $$
begin
  new.body_search_norm := public.normalize_arabic_for_search(new.body);
  return new;
end;
$$;

drop trigger if exists messages_body_search_norm on public.messages;
create trigger messages_body_search_norm
  before insert or update of body on public.messages
  for each row
  execute function public.tg_set_body_search_norm();

drop trigger if exists dm_messages_body_search_norm on public.dm_messages;
create trigger dm_messages_body_search_norm
  before insert or update of body on public.dm_messages
  for each row
  execute function public.tg_set_body_search_norm();

-- Backfill (idempotent)
update public.messages
set body_search_norm = public.normalize_arabic_for_search(body)
where body_search_norm is distinct from public.normalize_arabic_for_search(body);

update public.dm_messages
set body_search_norm = public.normalize_arabic_for_search(body)
where body_search_norm is distinct from public.normalize_arabic_for_search(body);

create index if not exists messages_body_search_norm_trgm_idx
  on public.messages using gin (body_search_norm gin_trgm_ops)
  where deleted_at is null;

create index if not exists dm_messages_body_search_norm_trgm_idx
  on public.dm_messages using gin (body_search_norm gin_trgm_ops)
  where deleted_at is null;
