-- Phase 12 follow-up — cross-worker voice token mint rate limit

create table if not exists public.voice_token_mints (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists voice_token_mints_user_created_idx
  on public.voice_token_mints (user_id, created_at desc);

alter table public.voice_token_mints enable row level security;

comment on table public.voice_token_mints is
  'Mint audit for createVoiceToken rate limit (Phase 12 follow-up). No direct client access.';

-- No SELECT/INSERT policies for authenticated/anon — only claim_voice_token_mint.

create or replace function public.claim_voice_token_mint()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  minute_count int;
begin
  if uid is null then
    raise exception 'not authenticated'
      using errcode = '42501';
  end if;

  delete from public.voice_token_mints
  where user_id = uid
    and created_at < now() - interval '5 minutes';

  select count(*) into minute_count
  from public.voice_token_mints
  where user_id = uid
    and created_at > now() - interval '60 seconds';

  if minute_count >= 12 then
    perform public.raise_rate_limited('voice_mint_minute');
  end if;

  insert into public.voice_token_mints (user_id) values (uid);
end;
$$;

revoke all on function public.claim_voice_token_mint() from public;
grant execute on function public.claim_voice_token_mint() to authenticated;

comment on function public.claim_voice_token_mint() is
  'Insert a mint hit or raise rate_limited:voice_mint_minute (12 / 60s).';
