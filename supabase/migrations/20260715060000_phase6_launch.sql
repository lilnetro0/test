-- Phase 6: moderation reports + account bans

alter table public.profiles
  add column if not exists banned_at timestamptz,
  add column if not exists ban_reason text;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_user_id uuid references public.profiles (id) on delete set null,
  message_id uuid references public.messages (id) on delete set null,
  reason text not null check (char_length(reason) between 2 and 64),
  details text not null default '',
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  constraint reports_has_target check (target_user_id is not null or message_id is not null),
  constraint reports_details_len check (char_length(details) <= 2000)
);

create index if not exists reports_reporter_created_idx
  on public.reports (reporter_id, created_at desc);

create index if not exists reports_status_created_idx
  on public.reports (status, created_at desc);

alter table public.reports enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reports'
      and policyname = 'Users create reports'
  ) then
    create policy "Users create reports"
      on public.reports for insert to authenticated
      with check (reporter_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reports'
      and policyname = 'Users read own reports'
  ) then
    create policy "Users read own reports"
      on public.reports for select to authenticated
      using (reporter_id = auth.uid());
  end if;
end $$;
