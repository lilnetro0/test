/**
 * Lightweight localStorage prefs for appearance + notification settings.
 * Demo-only persistence — no backend.
 */

const MOTION_KEY = "nexus.pref.reduceMotion";
const CONTRAST_KEY = "nexus.pref.highContrast";
const HUB_ORDER_KEY = "nexus.pref.hubOrder";
const HUB_NOTIF_KEY = "nexus.pref.hubNotifs";
const PROFILE_KEY = "nexus.pref.profile";

export type HubNotifMode = "all" | "mentions" | "mute";

/** hub_order / hub_notif_modes keys are hubs.slug (same as UI HubCard.id). */

export type ProfileDraft = {
  displayName: string;
  bio: string;
  status: string;
};

export function readBool(key: string, fallback = false): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const v = window.localStorage.getItem(key);
    if (v === null) return fallback;
    return v === "1";
  } catch {
    return fallback;
  }
}

export function writeBool(key: string, value: boolean) {
  try {
    window.localStorage.setItem(key, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function applyAppearanceClasses() {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  // Explicit user toggle; OS `prefers-reduced-motion` is handled in CSS.
  html.classList.toggle("reduce-motion", readBool(MOTION_KEY));
  html.classList.toggle("high-contrast", readBool(CONTRAST_KEY));
}

export function getReduceMotion() {
  return readBool(MOTION_KEY);
}

export function setReduceMotion(on: boolean) {
  writeBool(MOTION_KEY, on);
  applyAppearanceClasses();
}

export function getHighContrast() {
  return readBool(CONTRAST_KEY);
}

export function setHighContrast(on: boolean) {
  writeBool(CONTRAST_KEY, on);
  applyAppearanceClasses();
}

export function getHubOrder(fallback: string[]): string[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(HUB_ORDER_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return fallback;
    // Keep known ids, append any new games not in stored order
    const known = new Set(fallback);
    const ordered = parsed.filter((id) => known.has(id));
    for (const id of fallback) {
      if (!ordered.includes(id)) ordered.push(id);
    }
    return ordered;
  } catch {
    return fallback;
  }
}

export function setHubOrder(ids: string[]) {
  try {
    window.localStorage.setItem(HUB_ORDER_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export function getHubNotifs(): Record<string, HubNotifMode> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(HUB_NOTIF_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, HubNotifMode>;
  } catch {
    return {};
  }
}

export function setHubNotif(hubSlug: string, mode: HubNotifMode) {
  const all = getHubNotifs();
  all[hubSlug] = mode;
  try {
    window.localStorage.setItem(HUB_NOTIF_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export function getProfile(fallback: ProfileDraft): ProfileDraft {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as Partial<ProfileDraft>) };
  } catch {
    return fallback;
  }
}

export function setProfile(profile: ProfileDraft) {
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

export { MOTION_KEY, CONTRAST_KEY };
