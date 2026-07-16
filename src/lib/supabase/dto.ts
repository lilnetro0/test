/**
 * DTOs shaped like UI / mock-data types so sources can swap without redesigning components.
 * Domain: docs/DOMAIN-MODEL.md — `id` = hub slug; `gameId` = catalog games.id.
 */

export type HubCardDto = {
  /** hubs.slug — route / join key */
  id: string;
  /** games.id — catalog / hero key */
  gameId: string;
  hubUuid?: string;
  name: string;
  short: string;
  hubName: string;
  tint: string;
  textTint: string;
  activeCount: string;
  category: string;
  members: number;
  imageUrl?: string | null;
  bannerUrl?: string | null;
  backgroundUrl?: string | null;
  iconUrl?: string | null;
};

/** @deprecated Prefer `HubCardDto`. */
export type GameDto = HubCardDto;

export type TextChannelDto = {
  id: string;
  name: string;
  topic?: string;
  unread?: number;
};

export type VoiceChannelDto = {
  id: string;
  name: string;
  livekitRoomName?: string | null;
  capacity?: number | null;
  members: {
    name: string;
    userId?: string;
    muted?: boolean;
    deafened?: boolean;
    speaking?: boolean;
  }[];
};

export type MessageDto = {
  id: string;
  author: string;
  authorId: string;
  time: string;
  body: string;
  system?: boolean;
  pinned?: boolean;
  edited?: boolean;
  replyTo?: { author: string; body: string };
};

export type FriendDto = {
  id: string;
  name: string;
  tag: string;
  status: "online" | "idle" | "dnd" | "offline";
  activity?: string;
};

export type DmThreadDto = {
  id: string;
  with: FriendDto;
  lastMessage: string;
  lastTime: string;
  unread: number;
  messages: MessageDto[];
};

export type NotificationDto = {
  id: string;
  kind: "mention" | "friend" | "voice" | "system" | "dm";
  title: string;
  body: string;
  time: string;
  read: boolean;
  href?: string;
};

export type ProfileDto = {
  id: string;
  username: string;
  tag: string;
  displayName: string;
  bio: string;
  status: string;
  statusText: string;
  avatarUrl: string | null;
};
