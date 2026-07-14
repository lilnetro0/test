/**
 * Hand-written DB types matching supabase/migrations/20260715000000_nexus_core.sql.
 * Regenerate later with: npx supabase gen types typescript --project-id <id>
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type HubRole = "admin" | "mod" | "member";
export type FriendRequestStatus = "pending" | "accepted" | "declined";
export type NotificationKind = "mention" | "friend" | "voice" | "system" | "dm";
export type HubNotifMode = "all" | "mentions" | "mute";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          tag: string;
          display_name: string | null;
          bio: string;
          status: string;
          status_text: string;
          avatar_url: string | null;
          banned_at: string | null;
          ban_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          tag?: string;
          display_name?: string | null;
          bio?: string;
          status?: string;
          status_text?: string;
          avatar_url?: string | null;
          banned_at?: string | null;
          ban_reason?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_user_id: string | null;
          message_id: string | null;
          reason: string;
          details: string;
          status: string;
          created_at: string;
        };
        Insert: {
          reporter_id: string;
          target_user_id?: string | null;
          message_id?: string | null;
          reason: string;
          details?: string;
          status?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]> & {
          status?: string;
        };
      };
      games: {
        Row: {
          id: string;
          name: string;
          short: string;
          category: string;
          tint: string;
          text_tint: string;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          short: string;
          category: string;
          tint?: string;
          text_tint?: string;
          image_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["games"]["Insert"]>;
      };
      hubs: {
        Row: {
          id: string;
          game_id: string;
          slug: string;
          name: string;
          member_count: number;
          active_count: string;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          slug: string;
          name: string;
          member_count?: number;
          active_count?: string;
          image_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["hubs"]["Insert"]>;
      };
      hub_members: {
        Row: {
          hub_id: string;
          user_id: string;
          role: HubRole;
          joined_at: string;
        };
        Insert: {
          hub_id: string;
          user_id: string;
          role?: HubRole;
        };
        Update: Partial<Database["public"]["Tables"]["hub_members"]["Insert"]>;
      };
      text_channels: {
        Row: {
          id: string;
          hub_id: string;
          slug: string;
          name: string;
          topic: string | null;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          hub_id: string;
          slug: string;
          name: string;
          topic?: string | null;
          position?: number;
        };
        Update: Partial<Database["public"]["Tables"]["text_channels"]["Insert"]>;
      };
      voice_channels: {
        Row: {
          id: string;
          hub_id: string;
          slug: string;
          name: string;
          position: number;
          livekit_room_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          hub_id: string;
          slug: string;
          name: string;
          position?: number;
          livekit_room_name?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["voice_channels"]["Insert"]>;
      };
      messages: {
        Row: {
          id: string;
          channel_id: string;
          author_id: string;
          body: string;
          reply_to: string | null;
          pinned: boolean;
          edited_at: string | null;
          created_at: string;
          attachment_url: string | null;
          attachment_name: string | null;
          attachment_mime: string | null;
        };
        Insert: {
          id?: string;
          channel_id: string;
          author_id: string;
          body: string;
          reply_to?: string | null;
          pinned?: boolean;
          edited_at?: string | null;
          attachment_url?: string | null;
          attachment_name?: string | null;
          attachment_mime?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
      };
      message_reactions: {
        Row: {
          message_id: string;
          user_id: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          message_id: string;
          user_id: string;
          emoji: string;
        };
        Update: never;
      };
      friend_requests: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          status: FriendRequestStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_user_id: string;
          to_user_id: string;
          status?: FriendRequestStatus;
        };
        Update: Partial<Pick<Database["public"]["Tables"]["friend_requests"]["Row"], "status">>;
      };
      friendships: {
        Row: {
          user_id: string;
          friend_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          friend_id: string;
        };
        Update: never;
      };
      blocks: {
        Row: {
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          blocker_id: string;
          blocked_id: string;
        };
        Update: never;
      };
      dm_threads: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
        };
        Update: { updated_at?: string };
      };
      dm_participants: {
        Row: {
          thread_id: string;
          user_id: string;
          last_read_at: string | null;
        };
        Insert: {
          thread_id: string;
          user_id: string;
          last_read_at?: string | null;
        };
        Update: { last_read_at?: string | null };
      };
      dm_messages: {
        Row: {
          id: string;
          thread_id: string;
          author_id: string;
          body: string;
          created_at: string;
          attachment_url: string | null;
          attachment_name: string | null;
          attachment_mime: string | null;
        };
        Insert: {
          id?: string;
          thread_id: string;
          author_id: string;
          body: string;
          attachment_url?: string | null;
          attachment_name?: string | null;
          attachment_mime?: string | null;
        };
        Update: never;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          kind: NotificationKind;
          title: string;
          body: string;
          href: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: NotificationKind;
          title: string;
          body?: string;
          href?: string | null;
          read_at?: string | null;
        };
        Update: Partial<Pick<Database["public"]["Tables"]["notifications"]["Row"], "read_at">>;
      };
      user_prefs: {
        Row: {
          user_id: string;
          lang: "en" | "ar";
          reduce_motion: boolean;
          high_contrast: boolean;
          hub_order: Json;
          hub_notif_modes: Json;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          lang?: "en" | "ar";
          reduce_motion?: boolean;
          high_contrast?: boolean;
          hub_order?: Json;
          hub_notif_modes?: Json;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["user_prefs"]["Insert"], "user_id">>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_hub_member: { Args: { p_hub_id: string; p_user_id: string }; Returns: boolean };
      are_friends: { Args: { a: string; b: string }; Returns: boolean };
    };
    Enums: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
