/**
 * Community permission extension points (Game Home IA stabilization).
 * Not fully enforced yet — defines roles/caps for future moderation work.
 *
 * Current live roles in DB: HubRole = "admin" | "mod" | "member"
 * Visitor = authenticated but not in hub_members (preview only).
 */

/** Planned community roles (DB may grow; map onto HubRole + visitor). */
export type CommunityRoleId =
  | "owner"
  | "admin"
  | "moderator"
  | "member"
  | "visitor"
  | "muted";

/** Planned voice capability keys. */
export type VoicePermissionKey =
  | "join"
  | "speak"
  | "stream"
  | "camera"
  | "move_members"
  | "kick_members";

/** Planned community settings sections (admin UI later). */
export type CommunitySettingsSection =
  | "identity"
  | "permissions"
  | "channels"
  | "voice"
  | "invites"
  | "moderation"
  | "security";

export type CommunityPermissionMatrix = {
  role: CommunityRoleId;
  voice: Partial<Record<VoicePermissionKey, boolean>>;
  canManageChannels?: boolean;
  canModerateMessages?: boolean;
  canInvite?: boolean;
};

/** Default matrix — documentation / future seeding only. */
export const DEFAULT_COMMUNITY_PERMISSION_MATRIX: CommunityPermissionMatrix[] = [
  {
    role: "owner",
    voice: { join: true, speak: true, stream: true, camera: true, move_members: true, kick_members: true },
    canManageChannels: true,
    canModerateMessages: true,
    canInvite: true,
  },
  {
    role: "admin",
    voice: { join: true, speak: true, stream: true, camera: true, move_members: true, kick_members: true },
    canManageChannels: true,
    canModerateMessages: true,
    canInvite: true,
  },
  {
    role: "moderator",
    voice: { join: true, speak: true, stream: true, camera: true, move_members: true, kick_members: true },
    canModerateMessages: true,
    canInvite: true,
  },
  {
    role: "member",
    voice: { join: true, speak: true, stream: true, camera: true },
    canInvite: true,
  },
  {
    role: "visitor",
    voice: {},
  },
  {
    role: "muted",
    voice: { join: true, speak: false },
  },
];

/** Map current DB hub role → planned community role id. */
export function mapHubRoleToCommunityRole(
  hubRole: "admin" | "mod" | "member" | null | undefined,
  isMember: boolean,
): CommunityRoleId {
  if (!isMember) return "visitor";
  if (hubRole === "admin") return "admin";
  if (hubRole === "mod") return "moderator";
  return "member";
}
