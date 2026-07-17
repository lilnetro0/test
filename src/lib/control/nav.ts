import type { ControlPermission } from "./permissions";

export type ControlNavPhase = "p0" | "p1" | "p2" | "p3" | "p4" | "p5" | "p6" | "legacy";

export type ControlNavItem = {
  id: string;
  /** i18n key under control.nav.* */
  labelKey: string;
  /** Absolute path under /control */
  to: string;
  /** Required permission to show the item */
  permission: ControlPermission;
  /** When not p0/legacy, route shows a phase stub (unless shipped) */
  phase: ControlNavPhase;
  /** Optional search hint for command palette */
  searchHint?: string;
};

export type ControlNavGroup = {
  id: string;
  labelKey: string;
  items: ControlNavItem[];
};

/**
 * Sidebar IA — mirrors ADMIN-PANEL-BLUEPRINT §5–6.
 * Live: P0–P6 (full Control IA for shipped phases).
 */
export const CONTROL_NAV: ControlNavGroup[] = [
  {
    id: "command",
    labelKey: "control.nav.group.command",
    items: [
      {
        id: "dashboard",
        labelKey: "control.nav.dashboard",
        to: "/control",
        permission: "control.access",
        phase: "p0",
      },
      {
        id: "search",
        labelKey: "control.nav.search",
        to: "/control/search",
        permission: "control.access",
        phase: "p0",
        searchHint: "users hubs games",
      },
      {
        id: "notifications",
        labelKey: "control.nav.notifications",
        to: "/control/inbox",
        permission: "control.access",
        phase: "p0",
      },
      {
        id: "tasks",
        labelKey: "control.nav.tasks",
        to: "/control/tasks",
        permission: "control.access",
        phase: "p0",
      },
    ],
  },
  {
    id: "work",
    labelKey: "control.nav.group.work",
    items: [
      {
        id: "moderation",
        labelKey: "control.nav.moderation",
        to: "/control/moderation",
        permission: "moderation.read",
        phase: "p0",
      },
      {
        id: "appeals",
        labelKey: "control.nav.appeals",
        to: "/control/appeals",
        permission: "appeals.read",
        phase: "p0",
      },
      {
        id: "enforcement",
        labelKey: "control.nav.enforcement",
        to: "/control/enforcement",
        permission: "users.act",
        phase: "p0",
      },
      {
        id: "users",
        labelKey: "control.nav.users",
        to: "/control/users",
        permission: "users.read",
        phase: "p0",
      },
      {
        id: "communities",
        labelKey: "control.nav.communities",
        to: "/control/communities",
        permission: "communities.read",
        phase: "p0",
      },
      {
        id: "catalog",
        labelKey: "control.nav.catalog",
        to: "/control/games",
        permission: "catalog.read",
        phase: "p0",
      },
      {
        id: "channels",
        labelKey: "control.nav.channels",
        to: "/control/channels",
        permission: "communities.read",
        phase: "p0",
      },
      {
        id: "templates",
        labelKey: "control.nav.templates",
        to: "/control/templates",
        permission: "communities.act",
        phase: "p0",
      },
      {
        id: "media",
        labelKey: "control.nav.media",
        to: "/control/media",
        permission: "catalog.write",
        phase: "p0",
      },
      {
        id: "content",
        labelKey: "control.nav.content",
        to: "/control/content",
        permission: "content.read",
        phase: "p0",
      },
      {
        id: "voice",
        labelKey: "control.nav.voice",
        to: "/control/voice",
        permission: "voice.read",
        phase: "p0",
      },
      {
        id: "live",
        labelKey: "control.nav.live",
        to: "/control/live",
        permission: "voice.read",
        phase: "p0",
      },
      {
        id: "livekit",
        labelKey: "control.nav.livekit",
        to: "/control/livekit",
        permission: "voice.read",
        phase: "p0",
      },
      {
        id: "analytics",
        labelKey: "control.nav.analytics",
        to: "/control/analytics",
        permission: "analytics.read",
        phase: "p0",
      },
      {
        id: "community-health",
        labelKey: "control.nav.communityHealth",
        to: "/control/community-health",
        permission: "analytics.read",
        phase: "p0",
      },
      {
        id: "discovery",
        labelKey: "control.nav.discovery",
        to: "/control/discovery",
        permission: "content.act",
        phase: "p0",
      },
      {
        id: "growth",
        labelKey: "control.nav.growth",
        to: "/control/growth",
        permission: "analytics.read",
        phase: "p0",
      },
      {
        id: "safety",
        labelKey: "control.nav.safety",
        to: "/control/security",
        permission: "safety.read",
        phase: "p0",
      },
    ],
  },
  {
    id: "platform",
    labelKey: "control.nav.group.platform",
    items: [
      {
        id: "flags",
        labelKey: "control.nav.flags",
        to: "/control/flags",
        permission: "ops.flags",
        phase: "p0",
      },
      {
        id: "health",
        labelKey: "control.nav.health",
        to: "/control/system",
        permission: "ops.health",
        phase: "p0",
      },
      {
        id: "jobs",
        labelKey: "control.nav.jobs",
        to: "/control/jobs",
        permission: "ops.health",
        phase: "p0",
      },
      {
        id: "keys",
        labelKey: "control.nav.keys",
        to: "/control/keys",
        permission: "ops.settings",
        phase: "p0",
      },
      {
        id: "rate-limits",
        labelKey: "control.nav.rateLimits",
        to: "/control/rate-limits",
        permission: "ops.health",
        phase: "p0",
      },
      {
        id: "audit",
        labelKey: "control.nav.audit",
        to: "/control/audit",
        permission: "ops.audit",
        phase: "p0",
      },
      {
        id: "roles",
        labelKey: "control.nav.roles",
        to: "/control/roles",
        permission: "ops.roles",
        phase: "p0",
      },
      {
        id: "settings",
        labelKey: "control.nav.settings",
        to: "/control/settings",
        permission: "ops.settings",
        phase: "p0",
      },
    ],
  },
];
