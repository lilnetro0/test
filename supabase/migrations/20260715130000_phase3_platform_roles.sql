-- Phase 3 — platform roles + admin audit log
-- Durable platform_admin assignments; env ADMIN_USER_IDS remains bootstrap / break-glass.
-- Does NOT widen RLS on hubs/messages/profiles (mutations stay on server fns + service role).

create table if not exists public.platform_roles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  role text not null default 'platform_admin'
    check (role in ('platform_admin')),
  granted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists platform_roles_role_idx on public.platform_roles (role);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles (id) on delete cascade,
  action text not null,
  target_type text,
  target_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_actor_idx on public.admin_audit_log (actor_id);

create or replace function public.is_platform_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_roles r
    where r.user_id = p_user_id
      and r.role = 'platform_admin'
  );
$$;

revoke all on function public.is_platform_admin(uuid) from public;
grant execute on function public.is_platform_admin(uuid) to authenticated;
grant execute on function public.is_platform_admin(uuid) to service_role;

alter table public.platform_roles enable row level security;
alter table public.admin_audit_log enable row level security;

-- Own role visible to the user (for client checkIsAdmin / UX). No client writes.
drop policy if exists "Users read own platform role" on public.platform_roles;
create policy "Users read own platform role"
  on public.platform_roles for select
  to authenticated
  using (user_id = auth.uid());

-- Platform admins can read audit log; no client insert/update/delete.
drop policy if exists "Platform admins read audit log" on public.admin_audit_log;
create policy "Platform admins read audit log"
  on public.admin_audit_log for select
  to authenticated
  using (public.is_platform_admin(auth.uid()));

comment on table public.platform_roles is
  'Platform-level roles (not hub_members). Writes via service role only. ADMIN_USER_IDS bootstraps rows.';
comment on table public.admin_audit_log is
  'Append-only admin action log. Inserts via service role from createServerFn.';
