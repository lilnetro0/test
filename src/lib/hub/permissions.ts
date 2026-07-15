import type { HubRole } from "@/lib/supabase/types";

export type HubCaps = {
  canPin: boolean;
  canDeleteAny: boolean;
  canKick: boolean;
  canSetRole: boolean;
};

/** Capability matrix: member < mod < hub admin; platform admin overrides. */
export function hubCaps(
  hubRole: HubRole | null | undefined,
  isPlatformAdmin: boolean,
): HubCaps {
  if (isPlatformAdmin) {
    return { canPin: true, canDeleteAny: true, canKick: true, canSetRole: true };
  }
  const role = hubRole ?? "member";
  const isMod = role === "mod" || role === "admin";
  return {
    canPin: isMod,
    canDeleteAny: isMod,
    canKick: isMod,
    canSetRole: role === "admin",
  };
}

/** Kick hierarchy: mods may kick member/mod; only hub admin (or platform) kicks hub admins. */
export function canKickTarget(
  actorRole: HubRole | null | undefined,
  targetRole: HubRole | null | undefined,
  isPlatformAdmin: boolean,
): boolean {
  if (isPlatformAdmin) return true;
  const actor = actorRole ?? "member";
  const target = targetRole ?? "member";
  if (actor === "member") return false;
  if (target === "admin") return actor === "admin";
  return actor === "mod" || actor === "admin";
}

export function canDeleteMessage(
  caps: HubCaps,
  authorId: string | undefined,
  viewerId: string | undefined,
): boolean {
  if (caps.canDeleteAny) return true;
  return Boolean(authorId && viewerId && authorId === viewerId);
}
