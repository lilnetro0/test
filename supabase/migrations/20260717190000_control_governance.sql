-- Control P6 — announcements + discovery placements

create table if not exists public.control_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  locale text not null default 'ar'
    check (locale in ('ar', 'en', 'both')),
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists control_announcements_status_idx
  on public.control_announcements (status, updated_at desc);

alter table public.control_announcements enable row level security;

drop policy if exists "control_announcements_deny_all" on public.control_announcements;
create policy "control_announcements_deny_all"
  on public.control_announcements
  for all
  to authenticated
  using (false)
  with check (false);

create table if not exists public.control_discovery_placements (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('hub', 'game')),
  target_id text not null,
  region text,
  position int not null default 0,
  active boolean not null default true,
  note text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists control_discovery_active_idx
  on public.control_discovery_placements (active, position, created_at desc);

alter table public.control_discovery_placements enable row level security;

drop policy if exists "control_discovery_deny_all" on public.control_discovery_placements;
create policy "control_discovery_deny_all"
  on public.control_discovery_placements
  for all
  to authenticated
  using (false)
  with check (false);
