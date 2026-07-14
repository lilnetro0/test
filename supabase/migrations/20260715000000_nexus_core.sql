-- Nexus core schema — Phase 0
-- Auth users live in auth.users; public.profiles extends them.

create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────────
-- Profiles
-- ──────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  tag text not null default '0001',
  display_name text,
  bio text not null default '',
  status text not null default 'online',
  status_text text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_len check (char_length(username) between 2 and 32),
  constraint profiles_username_format check (username ~ '^[A-Za-z0-9_]+$'),
  constraint profiles_tag_format check (tag ~ '^[0-9]{4}$'),
  constraint profiles_username_tag_unique unique (username, tag)
);

create index profiles_username_idx on public.profiles (lower(username));

-- ──────────────────────────────────────────────
-- Games + Hubs
-- ──────────────────────────────────────────────
create table public.games (
  id text primary key,
  name text not null,
  short text not null,
  category text not null,
  tint text not null default 'bg-stone-500/20',
  text_tint text not null default 'text-stone-300',
  created_at timestamptz not null default now()
);

create table public.hubs (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references public.games (id) on delete cascade,
  slug text not null unique,
  name text not null,
  member_count int not null default 0,
  active_count text not null default '0',
  created_at timestamptz not null default now()
);

create index hubs_game_id_idx on public.hubs (game_id);

create table public.hub_members (
  hub_id uuid not null references public.hubs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'mod', 'member')),
  joined_at timestamptz not null default now(),
  primary key (hub_id, user_id)
);

create table public.text_channels (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.hubs (id) on delete cascade,
  slug text not null,
  name text not null,
  topic text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (hub_id, slug)
);

create table public.voice_channels (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.hubs (id) on delete cascade,
  slug text not null,
  name text not null,
  position int not null default 0,
  livekit_room_name text,
  created_at timestamptz not null default now(),
  unique (hub_id, slug)
);

-- ──────────────────────────────────────────────
-- Messages (hub text channels)
-- ──────────────────────────────────────────────
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.text_channels (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  reply_to uuid references public.messages (id) on delete set null,
  pinned boolean not null default false,
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  constraint messages_body_len check (char_length(body) between 1 and 4000)
);

create index messages_channel_created_idx on public.messages (channel_id, created_at desc);

create table public.message_reactions (
  message_id uuid not null references public.messages (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

-- ──────────────────────────────────────────────
-- Friends
-- ──────────────────────────────────────────────
create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles (id) on delete cascade,
  to_user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  constraint friend_requests_no_self check (from_user_id <> to_user_id),
  unique (from_user_id, to_user_id)
);

create table public.friendships (
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  constraint friendships_no_self check (user_id <> friend_id)
);

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_no_self check (blocker_id <> blocked_id)
);

-- ──────────────────────────────────────────────
-- Direct messages
-- ──────────────────────────────────────────────
create table public.dm_threads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dm_participants (
  thread_id uuid not null references public.dm_threads (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz,
  primary key (thread_id, user_id)
);

create table public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.dm_threads (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint dm_messages_body_len check (char_length(body) between 1 and 4000)
);

create index dm_messages_thread_created_idx on public.dm_messages (thread_id, created_at desc);

-- ──────────────────────────────────────────────
-- Notifications + prefs
-- ──────────────────────────────────────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('mention', 'friend', 'voice', 'system', 'dm')),
  title text not null,
  body text not null default '',
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);

create table public.user_prefs (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  lang text not null default 'en' check (lang in ('en', 'ar')),
  reduce_motion boolean not null default false,
  high_contrast boolean not null default false,
  hub_order jsonb not null default '[]'::jsonb,
  hub_notif_modes jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- Helpers
-- ──────────────────────────────────────────────
create or replace function public.is_hub_member(p_hub_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.hub_members m
    where m.hub_id = p_hub_id and m.user_id = p_user_id
  );
$$;

create or replace function public.channel_hub_id(p_channel_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select hub_id from public.text_channels where id = p_channel_id;
$$;

create or replace function public.is_dm_participant(p_thread_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.dm_participants p
    where p.thread_id = p_thread_id and p.user_id = p_user_id
  );
$$;

create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.friendships f
    where (f.user_id = a and f.friend_id = b)
       or (f.user_id = b and f.friend_id = a)
  );
$$;

-- Auto profile + prefs on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text;
  utag text;
begin
  uname := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    split_part(new.email, '@', 1),
    'player'
  );
  uname := regexp_replace(uname, '[^A-Za-z0-9_]', '', 'g');
  if char_length(uname) < 2 then
    uname := 'player';
  end if;
  uname := left(uname, 32);

  utag := coalesce(nullif(trim(new.raw_user_meta_data ->> 'tag'), ''), lpad((floor(random() * 10000))::text, 4, '0'));
  if utag !~ '^[0-9]{4}$' then
    utag := lpad((floor(random() * 10000))::text, 4, '0');
  end if;

  insert into public.profiles (id, username, tag, display_name, bio)
  values (
    new.id,
    uname,
    utag,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), uname),
    coalesce(new.raw_user_meta_data ->> 'bio', '')
  )
  on conflict (id) do nothing;

  insert into public.user_prefs (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger user_prefs_updated_at
  before update on public.user_prefs
  for each row execute function public.set_updated_at();

-- ──────────────────────────────────────────────
-- RLS
-- ──────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.hubs enable row level security;
alter table public.hub_members enable row level security;
alter table public.text_channels enable row level security;
alter table public.voice_channels enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;
alter table public.blocks enable row level security;
alter table public.dm_threads enable row level security;
alter table public.dm_participants enable row level security;
alter table public.dm_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.user_prefs enable row level security;

-- Profiles
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated
  using (true);

create policy "Users update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

-- Games / hubs (catalog readable by all auth users)
create policy "Games readable"
  on public.games for select to authenticated
  using (true);

create policy "Hubs readable"
  on public.hubs for select to authenticated
  using (true);

create policy "Hub members readable by members"
  on public.hub_members for select to authenticated
  using (public.is_hub_member(hub_id, auth.uid()) or user_id = auth.uid());

create policy "Users can join hubs"
  on public.hub_members for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can leave hubs"
  on public.hub_members for delete to authenticated
  using (user_id = auth.uid());

create policy "Users update own hub membership"
  on public.hub_members for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Text channels readable by hub members"
  on public.text_channels for select to authenticated
  using (public.is_hub_member(hub_id, auth.uid()));

create policy "Voice channels readable by hub members"
  on public.voice_channels for select to authenticated
  using (public.is_hub_member(hub_id, auth.uid()));

-- Messages
create policy "Members read channel messages"
  on public.messages for select to authenticated
  using (public.is_hub_member(public.channel_hub_id(channel_id), auth.uid()));

create policy "Members insert messages"
  on public.messages for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.is_hub_member(public.channel_hub_id(channel_id), auth.uid())
  );

create policy "Authors update own messages"
  on public.messages for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "Authors delete own messages"
  on public.messages for delete to authenticated
  using (author_id = auth.uid());

create policy "Members manage reactions"
  on public.message_reactions for all to authenticated
  using (
    public.is_hub_member(
      public.channel_hub_id((select channel_id from public.messages where id = message_id)),
      auth.uid()
    )
  )
  with check (user_id = auth.uid());

-- Friends
create policy "Users see own friend requests"
  on public.friend_requests for select to authenticated
  using (from_user_id = auth.uid() or to_user_id = auth.uid());

create policy "Users create friend requests"
  on public.friend_requests for insert to authenticated
  with check (from_user_id = auth.uid());

create policy "Recipient updates friend requests"
  on public.friend_requests for update to authenticated
  using (to_user_id = auth.uid() or from_user_id = auth.uid());

create policy "Users see own friendships"
  on public.friendships for select to authenticated
  using (user_id = auth.uid() or friend_id = auth.uid());

create policy "Users manage own friendships"
  on public.friendships for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users manage own blocks"
  on public.blocks for all to authenticated
  using (blocker_id = auth.uid())
  with check (blocker_id = auth.uid());

-- DMs
create policy "Participants see threads"
  on public.dm_threads for select to authenticated
  using (public.is_dm_participant(id, auth.uid()));

create policy "Participants see participants"
  on public.dm_participants for select to authenticated
  using (public.is_dm_participant(thread_id, auth.uid()));

create policy "Users insert self as participant"
  on public.dm_participants for insert to authenticated
  with check (user_id = auth.uid());

create policy "Participants read dm messages"
  on public.dm_messages for select to authenticated
  using (public.is_dm_participant(thread_id, auth.uid()));

create policy "Participants send dm messages"
  on public.dm_messages for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.is_dm_participant(thread_id, auth.uid())
  );

-- Notifications + prefs
create policy "Users see own notifications"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

create policy "Users update own notifications"
  on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users manage own prefs"
  on public.user_prefs for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Realtime publication for chat tables (idempotent)
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.dm_messages;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;
