-- Storage buckets + message/dm attachment columns
-- Same as migrations/20260715090000_storage_attachments.sql

alter table public.messages
  add column if not exists attachment_url text,
  add column if not exists attachment_name text,
  add column if not exists attachment_mime text;

alter table public.dm_messages
  add column if not exists attachment_url text,
  add column if not exists attachment_name text,
  add column if not exists attachment_mime text;

alter table public.messages drop constraint if exists messages_body_len;
alter table public.messages
  add constraint messages_body_len check (
    char_length(body) <= 4000
    and (char_length(body) >= 1 or attachment_url is not null)
  );

alter table public.dm_messages drop constraint if exists dm_messages_body_len;
alter table public.dm_messages
  add constraint dm_messages_body_len check (
    char_length(body) <= 4000
    and (char_length(coalesce(body, '')) >= 1 or attachment_url is not null)
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'avatars',
    'avatars',
    true,
    2097152,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'attachments',
    'attachments',
    true,
    10485760,
    array[
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'application/pdf', 'text/plain'
    ]
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Avatar public read" on storage.objects;
create policy "Avatar public read"
  on storage.objects for select to public
  using (bucket_id = 'avatars');

drop policy if exists "Avatar owner upload" on storage.objects;
create policy "Avatar owner upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Avatar owner update" on storage.objects;
create policy "Avatar owner update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Avatar owner delete" on storage.objects;
create policy "Avatar owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Attachment public read" on storage.objects;
create policy "Attachment public read"
  on storage.objects for select to public
  using (bucket_id = 'attachments');

drop policy if exists "Attachment owner upload" on storage.objects;
create policy "Attachment owner upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Attachment owner delete" on storage.objects;
create policy "Attachment owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

do $$ begin
  alter publication supabase_realtime add table public.message_reactions;
exception when duplicate_object then null;
end $$;
