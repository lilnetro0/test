/**
 * DTOs shaped like current UI / mock-data types so Phase 1–3 can swap sources
 * without redesigning components.
 */

export type GameDto = {
  id: string;
  name: string;
  short: string;
  hubName: string;
  tint: string;
  textTint: string;
  activeCount: string;
  category: string;
  members: number;
};

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
  members: { name: string; muted?: boolean; deafened?: boolean; speaking?: boolean }[];
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
