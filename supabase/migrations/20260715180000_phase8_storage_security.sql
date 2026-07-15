-- Phase 8 — storage MIME/size alignment + message attachment_mime CHECKs
-- Keep allowlists in sync with src/lib/supabase/storage-policy.ts

update storage.buckets
set
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'avatars';

update storage.buckets
set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'application/pdf', 'text/plain'
  ]
where id = 'attachments';

update storage.buckets
set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'hub-media';

-- Deny path traversal / odd object keys on user uploads
drop policy if exists "Attachment owner upload" on storage.objects;
create policy "Attachment owner upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
    and position('..' in name) = 0
    and position(chr(92) in name) = 0
  );

drop policy if exists "Avatar owner upload" on storage.objects;
create policy "Avatar owner upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and position('..' in name) = 0
    and position(chr(92) in name) = 0
  );

drop policy if exists "Avatar owner update" on storage.objects;
create policy "Avatar owner update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and position('..' in name) = 0
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and position('..' in name) = 0
  );

-- Row-level MIME allowlist (null = no attachment)
alter table public.messages drop constraint if exists messages_attachment_mime_allowed;
alter table public.messages
  add constraint messages_attachment_mime_allowed check (
    attachment_mime is null
    or attachment_mime = any (array[
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'application/pdf', 'text/plain'
    ])
  );

alter table public.dm_messages drop constraint if exists dm_messages_attachment_mime_allowed;
alter table public.dm_messages
  add constraint dm_messages_attachment_mime_allowed check (
    attachment_mime is null
    or attachment_mime = any (array[
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'application/pdf', 'text/plain'
    ])
  );

comment on constraint messages_attachment_mime_allowed on public.messages is
  'Phase 8 — attachment_mime must be null or an allowlisted type.';
comment on constraint dm_messages_attachment_mime_allowed on public.dm_messages is
  'Phase 8 — attachment_mime must be null or an allowlisted type.';
