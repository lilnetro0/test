/**
 * Community Feed architecture placeholder (not a full product surface yet).
 * Game Home reserves a slot for future announcements / events / media.
 */

export type CommunityFeedKind =
  | "announcement"
  | "event"
  | "tournament"
  | "patch_notes"
  | "news"
  | "featured_media";

export type CommunityFeedItemDraft = {
  id: string;
  kind: CommunityFeedKind;
  title: string;
  body?: string;
  href?: string;
  pinned?: boolean;
  createdAt?: string;
};

/** Section id used by Game Home layout for the reserved feed region. */
export const COMMUNITY_FEED_SECTION_ID = "community-feed";
