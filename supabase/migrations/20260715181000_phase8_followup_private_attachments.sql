-- Phase 8 follow-up — private attachments, user quota helper
-- Avatars + hub-media stay public. Attachments require auth + signed URLs.

update storage.buckets
set public = false
where id = 'attachments';

drop policy if exists "Attachment public read" on storage.objects;

-- Logged-in users may read attachment objects (chat/DM UI uses short-lived signed URLs).
drop policy if exists "Attachment authenticated read" on storage.objects;
create policy "Attachment authenticated read"
  on storage.objects for select to authenticated
  using (bucket_id = 'attachments');

-- Bytes used under the caller's folder in the attachments bucket.
create or replace function public.attachment_bytes_used()
returns bigint
language plpgsql
stable
security definer
set search_path = public, storage
as $$
declare
  actor uuid := auth.uid();
  total bigint := 0;
begin
  if actor is null then
    return 0;
  end if;

  select coalesce(sum((o.metadata->>'size')::bigint), 0)
  into total
  from storage.objects o
  where o.bucket_id = 'attachments'
    and (storage.foldername(o.name))[1] = actor::text;

  return total;
end;
$$;

revoke all on function public.attachment_bytes_used() from public;
grant execute on function public.attachment_bytes_used() to authenticated, service_role;

comment on function public.attachment_bytes_used() is
  'Sum of attachment object sizes for the caller (Phase 8 follow-up quota).';
