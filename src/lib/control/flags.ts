/**
 * Known Control feature flags — catalog keys + default copy.
 * DB rows in control_feature_flags override enabled state after migration.
 */

export type ControlFlagDef = {
  key: string;
  defaultEnabled: boolean;
  /** i18n key under control.flags.desc.* (optional fall back to key) */
  descKey: string;
};

export const CONTROL_FLAG_CATALOG: readonly ControlFlagDef[] = [
  {
    key: "voice.enabled",
    defaultEnabled: true,
    descKey: "control.flags.desc.voice",
  },
  {
    key: "lfg.enabled",
    defaultEnabled: true,
    descKey: "control.flags.desc.lfg",
  },
  {
    key: "discover.regional",
    defaultEnabled: true,
    descKey: "control.flags.desc.discover",
  },
  {
    key: "attachments.upload",
    defaultEnabled: true,
    descKey: "control.flags.desc.attachments",
  },
  {
    key: "maintenance.banner",
    defaultEnabled: false,
    descKey: "control.flags.desc.maintenance",
  },
] as const;
