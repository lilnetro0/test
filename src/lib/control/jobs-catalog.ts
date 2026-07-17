/**
 * Known async / ops jobs — inventory until a real job queue lands.
 */

export type ControlJobDef = {
  id: string;
  status: "manual" | "trigger" | "deferred";
  descKey: string;
  href?: string;
};

export const CONTROL_JOBS_CATALOG: readonly ControlJobDef[] = [
  {
    id: "health.probe",
    status: "manual",
    descKey: "control.jobs.desc.health",
    href: "/control/system",
  },
  {
    id: "livekit.probe",
    status: "manual",
    descKey: "control.jobs.desc.livekit",
    href: "/control/livekit",
  },
  {
    id: "mena.seed_channels",
    status: "manual",
    descKey: "control.jobs.desc.mena",
    href: "/control/templates",
  },
  {
    id: "account.deletion",
    status: "trigger",
    descKey: "control.jobs.desc.deletion",
  },
  {
    id: "push.dispatch",
    status: "deferred",
    descKey: "control.jobs.desc.push",
  },
  {
    id: "analytics.rollup",
    status: "deferred",
    descKey: "control.jobs.desc.analytics",
    href: "/control/analytics",
  },
] as const;
