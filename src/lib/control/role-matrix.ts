import type { ControlPermission } from "./permissions";

/**
 * Suggested role families (vision §5.12) — documentation matrix for P6.
 * Runtime still grants full PLATFORM_ADMIN_PERMISSIONS until fine-grained RBAC.
 */

export type ControlRoleFamilyId =
  | "owner"
  | "security"
  | "ts_lead"
  | "moderator"
  | "community"
  | "catalog"
  | "voice"
  | "analyst"
  | "developer";

export type ControlRoleFamily = {
  id: ControlRoleFamilyId;
  labelKey: string;
  permissions: readonly ControlPermission[];
};

const ALL: readonly ControlPermission[] = [
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
];

export const CONTROL_ROLE_FAMILIES: readonly ControlRoleFamily[] = [
  {
    id: "owner",
    labelKey: "control.matrix.family.owner",
    permissions: ALL,
  },
  {
    id: "security",
    labelKey: "control.matrix.family.security",
    permissions: [
      "control.access",
      "safety.read",
      "safety.write",
      "ops.audit",
      "ops.roles",
      "ops.settings",
      "ops.flags",
      "users.read",
      "users.act",
    ],
  },
  {
    id: "ts_lead",
    labelKey: "control.matrix.family.tsLead",
    permissions: [
      "control.access",
      "moderation.read",
      "moderation.act",
      "moderation.escalate",
      "appeals.read",
      "appeals.decide",
      "users.read",
      "users.act",
      "users.notes",
      "safety.read",
      "ops.audit",
    ],
  },
  {
    id: "moderator",
    labelKey: "control.matrix.family.moderator",
    permissions: [
      "control.access",
      "moderation.read",
      "moderation.act",
      "users.read",
      "users.notes",
      "appeals.read",
    ],
  },
  {
    id: "community",
    labelKey: "control.matrix.family.community",
    permissions: [
      "control.access",
      "communities.read",
      "communities.act",
      "content.read",
      "content.act",
      "analytics.read",
      "catalog.read",
    ],
  },
  {
    id: "catalog",
    labelKey: "control.matrix.family.catalog",
    permissions: ["control.access", "catalog.read", "catalog.write", "communities.read"],
  },
  {
    id: "voice",
    labelKey: "control.matrix.family.voice",
    permissions: ["control.access", "voice.read", "voice.act", "ops.health", "communities.read"],
  },
  {
    id: "analyst",
    labelKey: "control.matrix.family.analyst",
    permissions: ["control.access", "analytics.read", "communities.read", "catalog.read"],
  },
  {
    id: "developer",
    labelKey: "control.matrix.family.developer",
    permissions: [
      "control.access",
      "ops.flags",
      "ops.health",
      "ops.settings",
      "ops.audit",
      "analytics.read",
    ],
  },
] as const;
