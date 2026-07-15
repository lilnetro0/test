-- Arabic-first Phase 6: Discover LFG filter without leaking private channel rows
-- text_channels SELECT is hub-member-only; hubs are broadly readable.

alter table public.hubs
  add column if not exists has_lfg boolean not null default false;

comment on column public.hubs.has_lfg is
  'True when hub has a text channel with slug lfg (Discover filter). Updated by template seed / admin.';

-- Backfill from existing LFG channels
update public.hubs h
set has_lfg = true
where exists (
  select 1
  from public.text_channels tc
  where tc.hub_id = h.id
    and tc.slug = 'lfg'
);

create or replace function public.tg_hubs_sync_has_lfg()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.slug = 'lfg' then
      update public.hubs
      set has_lfg = exists (
        select 1 from public.text_channels t
        where t.hub_id = old.hub_id and t.slug = 'lfg' and t.id is distinct from old.id
      )
      where id = old.hub_id;
    end if;
    return old;
  end if;

  if new.slug = 'lfg' or (tg_op = 'UPDATE' and old.slug = 'lfg') then
    update public.hubs
    set has_lfg = exists (
      select 1 from public.text_channels t
      where t.hub_id = new.hub_id and t.slug = 'lfg'
    )
    where id = new.hub_id;
  end if;
  return new;
end;
$$;

drop trigger if exists text_channels_sync_has_lfg on public.text_channels;
create trigger text_channels_sync_has_lfg
  after insert or update of slug, hub_id or delete on public.text_channels
  for each row
  execute function public.tg_hubs_sync_has_lfg();
