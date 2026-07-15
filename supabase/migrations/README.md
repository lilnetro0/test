# supabase/migrations/

Source of truth for Nexus schema. Filename order = apply order (`YYYYMMDDHHMMSS_*.sql`).

| File | Purpose |
|------|---------|
| `20260715000000_nexus_core.sql` | Core tables, RLS, auth trigger |
| `20260715010000_phase2_hub_member_upsert.sql` | Hub member upsert policy |
| `20260715020000_ensure_profile.sql` | Profile ensure / insert policy |
| `20260715030000_phase3_friends_dms.sql` | Friends + DMs |
| `20260715040000_phase4_notifications.sql` | Notifications |
| `20260715060000_phase6_launch.sql` | Reports / ban fields |
| `20260715070000_security_hardening.sql` | Security hardening |
| `20260715080000_mention_tag.sql` | Mention tag matching |
| `20260715090000_storage_attachments.sql` | Storage buckets / policies |
| `20260715100000_admin_ops.sql` | Admin / hub media ops |
| `20260715120000_phase2_catalog_hubs.sql` | Official hubs for remaining catalog games |
| `20260715130000_phase3_platform_roles.sql` | `platform_roles`, `admin_audit_log`, `is_platform_admin` |
| `20260715140000_phase4_hub_roles.sql` | Hub mod/admin helpers, pin guard, kick/role RPCs |
| `20260715141000_phase4_founder_audit.sql` | Founder-on-first-join + hub mod audit → `admin_audit_log` |
| `20260715150000_phase5_messages_reliability.sql` | `messages.deleted_at`, `soft_delete_message`, live indexes |
| `20260715151000_phase5_followup_edits_dms_pagination.sql` | `message_edits`, DM soft-delete, body-len for soft-delete |
| `20260715160000_phase6_read_state_presence.sql` | Channel/DM read cursors, presence RPC, active_count refresh |
| `20260715161000_phase6_followup_unread_totals.sql` | Dock `user_message_unread_totals` RPC |
| `20260715170000_phase7_rate_limits.sql` | Chat/report/friend INSERT rate triggers |
| `20260715171000_phase7_followup_edit_reaction_limits.sql` | Edit + reaction rate triggers |
| `20260715180000_phase8_storage_security.sql` | Storage MIME/size + attachment_mime CHECKs |
| `20260715181000_phase8_followup_private_attachments.sql` | Private attachments + `attachment_bytes_used` |
| `20260715190000_phase9_trust_safety.sql` | Reports depth + guidelines deps + DM block gate |
| `20260715191000_phase9_followup_blocks_reports.sql` | Visible hub roster + report author harden |
| `20260715200000_phase10_account_lifecycle.sql` | `account_deletion_log` (self-delete audit) |
| `20260715210000_phase11_push_devices.sql` | `push_devices` + `user_prefs.push_enabled` |
| `20260715211000_phase11_followup_notif_prefs.sql` | Sound / mentions-only / match DND prefs |
| `20260715221000_phase12_followup_voice_mint_limit.sql` | Cross-worker voice mint rate limit |
| `20260715230000_af2_region_discovery.sql` | `user_prefs.region` + `hubs.region` |
| `20260715240000_af4_arabic_search_norm.sql` | `body_search_norm` + Arabic fold FN + trigram indexes |
| `20260715250000_af6_hub_has_lfg.sql` | `hubs.has_lfg` + sync trigger for Discover LFG filter |
| `20260715260000_af10_report_voice_channel.sql` | `reports.voice_channel_id` + has_target/policy |
| `20260715270000_af13_catalog_search_norm.sql` | hubs/games `name_search_norm` + triggers |
| `20260715280000_af15_profile_search_norm.sql` | profiles username/display_name search norms |

New changes: **add a new timestamped file**. Do not rewrite migrations already applied on shared projects.

Ops details: `docs/DATABASE-OPERATIONS.md`.
