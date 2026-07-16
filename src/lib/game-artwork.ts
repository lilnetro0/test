/**
 * Official game artwork resolution.
 * Prefer admin-uploaded assets; fall back cleanly when a slot is empty.
 */

export type GameArtworkSlot = "cover" | "banner" | "background" | "icon";

export type GameArtworkUrls = {
  /** Card / cover (games.image_url, or hub override) */
  coverUrl?: string | null;
  bannerUrl?: string | null;
  backgroundUrl?: string | null;
  iconUrl?: string | null;
};

/** DB column for a game artwork slot (cover = legacy image_url). */
export function gameArtworkColumn(
  slot: GameArtworkSlot,
): "image_url" | "banner_url" | "background_url" | "icon_url" {
  switch (slot) {
    case "cover":
      return "image_url";
    case "banner":
      return "banner_url";
    case "background":
      return "background_url";
    case "icon":
      return "icon_url";
  }
}

/** Hero / featured — banner, else cover. */
export function resolveBannerUrl(art: GameArtworkUrls): string | null {
  return art.bannerUrl || art.coverUrl || null;
}

/** Cards / search tiles — cover, else banner. */
export function resolveCoverUrl(art: GameArtworkUrls): string | null {
  return art.coverUrl || art.bannerUrl || null;
}

/** List / dock / hub chip — icon, else cover. */
export function resolveIconUrl(art: GameArtworkUrls): string | null {
  return art.iconUrl || art.coverUrl || null;
}

/** Ambient chrome — background only (no forced fallback). */
export function resolveBackgroundUrl(art: GameArtworkUrls): string | null {
  return art.backgroundUrl || null;
}

/** Responsive sizes hints for <img sizes>. */
export const GAME_ART_SIZES = {
  icon: "40px",
  card: "(max-width: 640px) 40vw, 160px",
  banner: "100vw",
  background: "100vw",
} as const;
