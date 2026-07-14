-- Admin ops: catalog image URLs, hub-media bucket, service_role hub role bypass

alter table public.games
  add column if not exists image_url text;

alter table public.hubs
  add column if not exists image_url text;

create or replace function public.hub_members_protect_role()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.role := 'member';
    return new;
  end if;
  new.role := old.role;
  return new;
end;
$$;

drop trigger if exists hub_members_protect_role on public.hub_members;
create trigger hub_members_protect_role
  before insert or update on public.hub_members
  for each row execute function public.hub_members_protect_role();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'hub-media',
    'hub-media',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Hub media public read" on storage.objects;
create policy "Hub media public read"
  on storage.objects for select to public
  using (bucket_id = 'hub-media');
