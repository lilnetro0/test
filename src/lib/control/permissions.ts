/**
 * Nexus Control — permission stubs (P0).
 * Blueprint §3: fine-grained families. Until Roles & Access (P6 matrix), every
 * permission maps 1:1 to platform_admin / ADMIN_USER_IDS via requireAdmin.
 */

export const CONTROL_PERMISSIONS = [
  "control.access",
  "moderation.read",
  "moderation.act",
  "moderation.escalate",
  "appeals.read",
  "appeals.decide",
  "users.read",
  "users.act",
  "users.notes",
  "communities.read",
  "communities.act",
  "catalog.read",
  "catalog.write",
  "content.read",
  "content.act",
  "voice.read",
  "voice.act",
  "safety.read",
  "safety.write",
  "analytics.read",
  "ops.flags",
  "ops.health",
  "ops.audit",
  "ops.roles",
  "ops.settings",
] as const;

export type ControlPermission = (typeof CONTROL_PERMISSIONS)[number];

/** Full grant set for platform admins (P0 bootstrap). */
export const PLATFORM_ADMIN_PERMISSIONS: readonly ControlPermission[] = CONTROL_PERMISSIONS;

export function hasPermission(
  granted: ReadonlySet<ControlPermission> | readonly ControlPermission[],
  permission: ControlPermission,
): boolean {
  const set = granted instanceof Set ? granted : new Set(granted);
  return set.has(permission);
}

export function hasAnyPermission(
  granted: ReadonlySet<ControlPermission> | readonly ControlPermission[],
  permissions: readonly ControlPermission[],
): boolean {
  return permissions.some((p) => hasPermission(granted, p));
}
