/**
 * Public (consumer-facing) reads of Control governance data.
 * No auth: exposes only published announcements, catalog flag states,
 * and active discovery placements. Tables are deny-all under RLS, so the
 * service-role client is the single gate — keep the shape minimal.
 */

import { createServerFn } from "@tanstack/react-start";
import { CONTROL_FLAG_CATALOG } from "@/lib/control/flags";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type PublicAnnouncement = {
  id: string;
  title: string;
  body: string;
  locale: "ar" | "en" | "both";
  publishedAt: string | null;
};

export type PublicFlagKey = (typeof CONTROL_FLAG_CATALOG)[number]["key"];

export type PublicPlatformFlags = Record<PublicFlagKey, boolean>;

export type PublicPlatformNotices = {
  maintenance: boolean;
  flags: PublicPlatformFlags;
  announcements: PublicAnnouncement[];
  /** hubs.id (uuid) of actively featured hubs, in placement order */
  featuredHubIds: string[];
  /** games.id of actively featured games, in placement order */
  featuredGameIds: string[];
};

export function defaultPlatformFlags(): PublicPlatformFlags {
  const flags = {} as PublicPlatformFlags;
  for (const f of CONTROL_FLAG_CATALOG) {
    flags[f.key] = f.defaultEnabled;
  }
  return flags;
}

const EMPTY: PublicPlatformNotices = {
  maintenance: false,
  flags: defaultPlatformFlags(),
  announcements: [],
  featuredHubIds: [],
  featuredGameIds: [],
};

function isMissingRelation(error: { message?: string } | null | undefined): boolean {
  const msg = (error?.message ?? "").toLowerCase();
  return msg.includes("does not exist") || msg.includes("schema cache");
}

export const getPublicPlatformNotices = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicPlatformNotices> => {
    const admin = getSupabaseAdminClient();
    if (!admin) return EMPTY;

    const [flagRes, annRes, placementRes] = await Promise.all([
      admin.from("control_feature_flags").select("key, enabled"),
      admin
        .from("control_announcements")
        .select("id, title, body, locale, status, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(3),
      admin
        .from("control_discovery_placements")
        .select("kind, target_id, active, position")
        .eq("active", true)
        .order("position", { ascending: true })
        .limit(24),
    ]);

    const flags = defaultPlatformFlags();
    if (!flagRes.error && flagRes.data) {
      for (const row of flagRes.data) {
        const key = row.key as PublicFlagKey;
        if (key in flags) flags[key] = Boolean(row.enabled);
      }
    }

    const announcements: PublicAnnouncement[] =
      annRes.error && !isMissingRelation(annRes.error)
        ? []
        : (annRes.data ?? []).map((r) => ({
            id: r.id as string,
            title: (r.title as string) ?? "",
            body: (r.body as string) ?? "",
            locale: (r.locale as PublicAnnouncement["locale"]) ?? "both",
            publishedAt: (r.published_at as string | null) ?? null,
          }));

    const placements =
      placementRes.error || !placementRes.data ? [] : placementRes.data;
    const featuredHubIds = placements
      .filter((p) => p.kind === "hub")
      .map((p) => p.target_id as string);
    const featuredGameIds = placements
      .filter((p) => p.kind === "game")
      .map((p) => p.target_id as string);

    return {
      maintenance: flags["maintenance.banner"],
      flags,
      announcements,
      featuredHubIds,
      featuredGameIds,
    };
  },
);

/* ── Client-side session cache ─────────────────────────────────────────── */

let cache: Promise<PublicPlatformNotices> | null = null;

/** Fetch notices once per session (browser); safe to call from many screens. */
export function fetchPlatformNoticesCached(): Promise<PublicPlatformNotices> {
  if (!cache) {
    cache = getPublicPlatformNotices().catch(() => {
      cache = null;
      return EMPTY;
    });
  }
  return cache;
}
