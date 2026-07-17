/**
 * Rate-limit policy catalog — mirrors supabase phase7 triggers (read-only UI).
 * Tunable DB policies are a future migration; this keeps ops visible.
 */

export type ControlRateLimitPolicy = {
  id: string;
  scope: string;
  burst: string;
  sustained: string;
  source: string;
};

export const CONTROL_RATE_LIMIT_POLICIES: readonly ControlRateLimitPolicy[] = [
  {
    id: "channel_messages",
    scope: "channel / messages",
    burst: "5 / 5s",
    sustained: "40 / 60s",
    source: "messages_enforce_rate_limit",
  },
  {
    id: "dm_messages",
    scope: "DM messages",
    burst: "5 / 5s",
    sustained: "30 / 60s",
    source: "dm_messages_enforce_rate_limit",
  },
  {
    id: "message_edits",
    scope: "message edits",
    burst: "3 / 5s",
    sustained: "10 / 60s",
    source: "messages_enforce_edit_rate_limit",
  },
  {
    id: "reactions",
    scope: "reactions",
    burst: "8 / 5s",
    sustained: "40 / 60s",
    source: "message_reactions_enforce_rate_limit",
  },
  {
    id: "reports_hour",
    scope: "reports (hourly)",
    burst: "—",
    sustained: "10 / hour",
    source: "reports_enforce_rate_limit",
  },
  {
    id: "reports_target",
    scope: "reports (per target / day)",
    burst: "—",
    sustained: "3 / day",
    source: "reports_enforce_rate_limit",
  },
  {
    id: "friend_requests",
    scope: "friend requests",
    burst: "—",
    sustained: "20 / day",
    source: "friend_requests_enforce_rate_limit",
  },
  {
    id: "voice_mint",
    scope: "voice token mint",
    burst: "—",
    sustained: "claim_voice_token_mint RPC",
    source: "claim_voice_token_mint",
  },
] as const;
