-- Repair: restore prereqs for AF4/AF13/AF15 when Phase 4 hub helpers
-- or AF4 folded away mid-transaction (common when SQL Editor paste skips files).
-- Safe to re-run (idempotent create or replace).
--
-- Apply this, then re-run:
--   20260715240000_af4_arabic_search_norm.sql
--   20260715270000_af13_catalog_search_norm.sql
--   20260715280000_af15_profile_search_norm.sql

-- 1) Hub mod helpers (from phase4_hub_roles)
create or replace function public.is_hub_mod(p_hub_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.hub_members m
    where m.hub_id = p_hub_id
      and m.user_id = p_user_id
      and m.role in ('mod', 'admin')
  );
$$;

create or replace function public.is_hub_admin(p_hub_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.hub_members m
    where m.hub_id = p_hub_id
      and m.user_id = p_user_id
      and m.role = 'admin'
  );
$$;

revoke all on function public.is_hub_mod(uuid, uuid) from public;
revoke all on function public.is_hub_admin(uuid, uuid) from public;
grant execute on function public.is_hub_mod(uuid, uuid) to authenticated, service_role;
grant execute on function public.is_hub_admin(uuid, uuid) to authenticated, service_role;

-- Nest pin IF so body_search_norm backfills never resolve is_hub_mod when
-- pinned did not change (avoids 42883 without needing session_replication_role).
create or replace function public.messages_protect_pinned()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.pinned is distinct from old.pinned then
    if coalesce(auth.role(), '') is distinct from 'service_role'
       and not public.is_hub_mod(public.channel_hub_id(old.channel_id), auth.uid())
    then
      new.pinned := old.pinned;
    end if;
  end if;
  return new;
end;
$$;

-- Only rewrite audit trigger if Phase 4 founder audit is present
do $$
begin
  if to_regprocedure('public.hub_write_mod_audit(uuid, text, text, text, jsonb)') is null then
    return;
  end if;

  execute $fn$
    create or replace function public.messages_audit_mod_pin()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $body$
    begin
      if tg_op = 'UPDATE' and new.pinned is distinct from old.pinned then
        if coalesce(auth.role(), '') is distinct from 'service_role'
           and public.is_hub_mod(public.channel_hub_id(old.channel_id), auth.uid())
        then
          perform public.hub_write_mod_audit(
            auth.uid(),
            case when new.pinned then 'message.pin' else 'message.unpin' end,
            'message',
            old.id::text,
            jsonb_build_object('hub_id', public.channel_hub_id(old.channel_id))
          );
        end if;
      end if;
      return new;
    end;
    $body$
  $fn$;
end;
$$;

-- 2) Arabic search fold (from AF4) — required by AF13/AF15
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
  s := normalize(s, NFKC);
  s := replace(s, U&'\0640', '');
  s := regexp_replace(s, U&'[\064B-\065F\0670\06D6-\06ED]', '', 'g');
  s := translate(s, U&'\0623\0625\0622\0671', U&'\0627\0627\0627\0627');
  s := replace(s, U&'\0649', U&'\064A');
  s := replace(s, U&'\0629', U&'\0647');
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
