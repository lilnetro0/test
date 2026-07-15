-- =============================================================================
-- Nexus schema verification (read-only)
-- Paste into Supabase SQL Editor against ANY environment (dev/staging/prod).
-- Does not modify data.
--
-- Interpret rows with status = MISSING using docs/DATABASE-OPERATIONS.md
-- § "Live project inventory". Expected = migrations through 20260715180000.
-- =============================================================================

with expected_tables(name) as (
  values
    ('profiles'),
    ('user_prefs'),
    ('games'),
    ('hubs'),
    ('hub_members'),
    ('text_channels'),
    ('voice_channels'),
    ('messages'),
    ('message_edits'),
    ('message_reactions'),
    ('channel_member_states'),
    ('friend_requests'),
    ('friendships'),
    ('blocks'),
    ('dm_threads'),
    ('dm_participants'),
    ('dm_messages'),
    ('notifications'),
    ('reports'),
    ('platform_roles'),
    ('admin_audit_log'),
    ('account_deletion_log'),
    ('push_devices'),
    ('voice_token_mints')
),
present_tables as (
  select c.relname as name
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
),
table_check as (
  select
    e.name as object_name,
    'table'::text as object_kind,
    case when p.name is null then 'MISSING' else 'ok' end as status
  from expected_tables e
  left join present_tables p on p.name = e.name
),
expected_columns(table_name, column_name) as (
  values
    ('profiles', 'banned_at'),
    ('profiles', 'ban_reason'),
    ('profiles', 'tag'),
    ('profiles', 'last_seen_at'),
    ('messages', 'attachment_url'),
    ('messages', 'attachment_name'),
    ('messages', 'attachment_mime'),
    ('messages', 'deleted_at'),
    ('dm_messages', 'attachment_url'),
    ('dm_messages', 'deleted_at'),
    ('dm_participants', 'last_read_at'),
    ('channel_member_states', 'last_read_at'),
    ('games', 'image_url'),
    ('hubs', 'image_url'),
    ('user_prefs', 'push_enabled'),
    ('user_prefs', 'notif_sound'),
    ('user_prefs', 'notif_mentions_only'),
    ('user_prefs', 'notif_match_dnd'),
    ('push_devices', 'token'),
    ('push_devices', 'platform')
),
column_check as (
  select
    ec.table_name || '.' || ec.column_name as object_name,
    'column'::text as object_kind,
    case
      when exists (
        select 1
        from information_schema.columns c
        where c.table_schema = 'public'
          and c.table_name = ec.table_name
          and c.column_name = ec.column_name
      ) then 'ok'
      else 'MISSING'
    end as status
  from expected_columns ec
),
expected_functions(name) as (
  values
    ('handle_new_user'),
    ('set_updated_at'),
    ('is_hub_member'),
    ('channel_hub_id'),
    ('is_dm_participant'),
    ('are_friends'),
    ('is_banned'),
    ('notify_user'),
    ('is_platform_admin'),
    ('is_hub_mod'),
    ('is_hub_admin'),
    ('hub_kick_member'),
    ('hub_set_member_role'),
    ('hub_write_mod_audit'),
    ('soft_delete_message'),
    ('soft_delete_dm_message'),
    ('mark_channel_read'),
    ('mark_dm_read'),
    ('hub_channel_unreads'),
    ('dm_thread_unread'),
    ('set_presence'),
    ('refresh_hub_active_count'),
    ('user_message_unread_totals'),
    ('raise_rate_limited'),
    ('attachment_bytes_used'),
    ('list_hub_members_visible'),
    ('claim_voice_token_mint')
),
function_check as (
  select
    e.name as object_name,
    'function'::text as object_kind,
    case
      when exists (
        select 1
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = e.name
      ) then 'ok'
      else 'MISSING'
    end as status
  from expected_functions e
),
expected_buckets(name) as (
  values
    ('avatars'),
    ('attachments'),
    ('hub-media')
),
bucket_check as (
  select
    e.name as object_name,
    'storage_bucket'::text as object_kind,
    case
      when to_regclass('storage.buckets') is null then 'SKIP_NO_STORAGE'
      when exists (select 1 from storage.buckets b where b.id = e.name or b.name = e.name)
        then 'ok'
      else 'MISSING'
    end as status
  from expected_buckets e
)
select * from table_check
union all
select * from column_check
union all
select * from function_check
union all
select * from bucket_check
order by
  case object_kind
    when 'table' then 1
    when 'column' then 2
    when 'function' then 3
    else 4
  end,
  status desc,
  object_name;

-- Optional (CLI-managed projects only — errors if table absent):
--   select version, name, statements
--   from supabase_migrations.schema_migrations
--   order by version;
