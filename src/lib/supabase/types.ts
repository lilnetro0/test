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
          last_seen_at: string | null;
          banned_at: string | null;
          ban_reason: string | null;
          username_search_norm: string | null;
          display_name_search_norm: string | null;
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
          last_seen_at?: string | null;
          banned_at?: string | null;
          ban_reason?: string | null;
          username_search_norm?: string | null;
          display_name_search_norm?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_user_id: string | null;
          message_id: string | null;
          dm_message_id: string | null;
          voice_channel_id: string | null;
          reason: string;
          details: string;
          status: string;
          resolution_note: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          created_at: string;
        };
        Insert: {
          reporter_id: string;
          target_user_id?: string | null;
          message_id?: string | null;
          dm_message_id?: string | null;
          voice_channel_id?: string | null;
          reason: string;
          details?: string;
          status?: string;
          resolution_note?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]> & {
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_target_user_id_fkey";
            columns: ["target_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
          banner_url: string | null;
          background_url: string | null;
          icon_url: string | null;
          name_search_norm: string | null;
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
          banner_url?: string | null;
          background_url?: string | null;
          icon_url?: string | null;
          name_search_norm?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["games"]["Insert"]>;
        Relationships: [];
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
          region: string | null;
          has_lfg: boolean;
          name_search_norm: string | null;
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
          region?: string | null;
          has_lfg?: boolean;
          name_search_norm?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["hubs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "hubs_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "hub_members_hub_id_fkey";
            columns: ["hub_id"];
            isOneToOne: false;
            referencedRelation: "hubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hub_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [];
      };
      channel_member_states: {
        Row: {
          channel_id: string;
          user_id: string;
          last_read_at: string;
        };
        Insert: {
          channel_id: string;
          user_id: string;
          last_read_at?: string;
        };
        Update: { last_read_at?: string };
        Relationships: [];
      };
      voice_channels: {
        Row: {
          id: string;
          hub_id: string;
          slug: string;
          name: string;
          position: number;
          livekit_room_name: string | null;
          capacity: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          hub_id: string;
          slug: string;
          name: string;
          position?: number;
          livekit_room_name?: string | null;
          capacity?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["voice_channels"]["Insert"]>;
        Relationships: [];
      };
      control_feature_flags: {
        Row: {
          key: string;
          enabled: boolean;
          description: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          key: string;
          enabled?: boolean;
          description?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["control_feature_flags"]["Insert"]>;
        Relationships: [];
      };
      control_announcements: {
        Row: {
          id: string;
          title: string;
          body: string;
          locale: string;
          status: string;
          published_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body: string;
          locale?: string;
          status?: string;
          published_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["control_announcements"]["Insert"]>;
        Relationships: [];
      };
      control_discovery_placements: {
        Row: {
          id: string;
          kind: string;
          target_id: string;
          region: string | null;
          position: number;
          active: boolean;
          note: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          kind: string;
          target_id: string;
          region?: string | null;
          position?: number;
          active?: boolean;
          note?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["control_discovery_placements"]["Insert"]>;
        Relationships: [];
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
          deleted_at: string | null;
          attachment_url: string | null;
          attachment_name: string | null;
          attachment_mime: string | null;
          body_search_norm: string | null;
        };
        Insert: {
          id?: string;
          channel_id: string;
          author_id: string;
          body: string;
          reply_to?: string | null;
          pinned?: boolean;
          edited_at?: string | null;
          deleted_at?: string | null;
          attachment_url?: string | null;
          attachment_name?: string | null;
          attachment_mime?: string | null;
          body_search_norm?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "messages_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_reply_to_fkey";
            columns: ["reply_to"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
      message_edits: {
        Row: {
          id: string;
          message_id: string;
          editor_id: string;
          previous_body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          editor_id: string;
          previous_body: string;
          created_at?: string;
        };
        Update: { [_ in never]: never };
        Relationships: [];
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
        Update: { [_ in never]: never };
        Relationships: [];
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
        Relationships: [];
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
        Update: { [_ in never]: never };
        Relationships: [];
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
        Update: { [_ in never]: never };
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey";
            columns: ["blocked_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "dm_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      dm_messages: {
        Row: {
          id: string;
          thread_id: string;
          author_id: string;
          body: string;
          created_at: string;
          deleted_at: string | null;
          attachment_url: string | null;
          attachment_name: string | null;
          attachment_mime: string | null;
          body_search_norm: string | null;
        };
        Insert: {
          id?: string;
          thread_id: string;
          author_id: string;
          body: string;
          deleted_at?: string | null;
          attachment_url?: string | null;
          attachment_name?: string | null;
          attachment_mime?: string | null;
          body_search_norm?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["dm_messages"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "dm_messages_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [];
      };
      user_prefs: {
        Row: {
          user_id: string;
          lang: "en" | "ar";
          region: string | null;
          reduce_motion: boolean;
          high_contrast: boolean;
          hub_order: Json;
          hub_notif_modes: Json;
          push_enabled: boolean;
          notif_sound: boolean;
          notif_mentions_only: boolean;
          notif_match_dnd: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          lang?: "en" | "ar";
          region?: string | null;
          reduce_motion?: boolean;
          high_contrast?: boolean;
          hub_order?: Json;
          hub_notif_modes?: Json;
          push_enabled?: boolean;
          notif_sound?: boolean;
          notif_mentions_only?: boolean;
          notif_match_dnd?: boolean;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["user_prefs"]["Insert"], "user_id">>;
        Relationships: [];
      };
      push_devices: {
        Row: {
          id: string;
          user_id: string;
          platform: string;
          token: string;
          enabled: boolean;
          user_agent: string | null;
          last_seen_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform: string;
          token: string;
          enabled?: boolean;
          user_agent?: string | null;
          last_seen_at?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["push_devices"]["Insert"], "id">>;
        Relationships: [];
      };
      voice_token_mints: {
        Row: {
          id: number;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          created_at?: string;
        };
        Update: { [_ in never]: never };
        Relationships: [];
      };
      platform_roles: {
        Row: {
          user_id: string;
          role: "platform_admin";
          granted_by: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role?: "platform_admin";
          granted_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["platform_roles"]["Insert"], "user_id">>;
        Relationships: [];
      };
      admin_audit_log: {
        Row: {
          id: string;
          actor_id: string;
          action: string;
          target_type: string | null;
          target_id: string | null;
          meta: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id: string;
          action: string;
          target_type?: string | null;
          target_id?: string | null;
          meta?: Json;
          created_at?: string;
        };
        Update: { [_ in never]: never };
        Relationships: [];
      };
      account_deletion_log: {
        Row: {
          id: string;
          user_id: string;
          username: string | null;
          email_hash: string | null;
          requested_at: string;
          meta: Json;
        };
        Insert: {
          id?: string;
          user_id: string;
          username?: string | null;
          email_hash?: string | null;
          requested_at?: string;
          meta?: Json;
        };
        Update: { [_ in never]: never };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_hub_member: { Args: { p_hub_id: string; p_user_id: string }; Returns: boolean };
      are_friends: { Args: { a: string; b: string }; Returns: boolean };
      is_platform_admin: { Args: { p_user_id: string }; Returns: boolean };
      is_hub_mod: { Args: { p_hub_id: string; p_user_id: string }; Returns: boolean };
      is_hub_admin: { Args: { p_hub_id: string; p_user_id: string }; Returns: boolean };
      hub_kick_member: { Args: { p_hub_id: string; p_user_id: string }; Returns: undefined };
      hub_set_member_role: {
        Args: { p_hub_id: string; p_user_id: string; p_role: string };
        Returns: undefined;
      };
      hub_write_mod_audit: {
        Args: {
          p_actor: string;
          p_action: string;
          p_target_type: string;
          p_target_id: string;
          p_meta?: Json;
        };
        Returns: undefined;
      };
      soft_delete_message: { Args: { p_message_id: string }; Returns: undefined };
      soft_delete_dm_message: { Args: { p_message_id: string }; Returns: undefined };
      normalize_arabic_for_search: { Args: { p_input: string }; Returns: string };
      mark_channel_read: { Args: { p_channel_id: string }; Returns: undefined };
      mark_dm_read: { Args: { p_thread_id: string }; Returns: undefined };
      accept_friend_request: { Args: { p_request_id: string }; Returns: undefined };
      decline_friend_request: { Args: { p_request_id: string }; Returns: undefined };
      remove_friend: { Args: { p_friend_id: string }; Returns: undefined };
      get_or_create_dm_thread: { Args: { p_other_user_id: string }; Returns: string };
      hub_channel_unreads: {
        Args: { p_hub_id: string };
        Returns: { channel_id: string; unread: number }[];
      };
      dm_thread_unread: { Args: { p_thread_id: string }; Returns: number };
      set_presence: { Args: { p_status: string }; Returns: undefined };
      refresh_hub_active_count: { Args: { p_hub_id: string }; Returns: string };
      user_message_unread_totals: {
        Args: Record<PropertyKey, never>;
        Returns: { channel_unread: number; dm_unread: number }[];
      };
      attachment_bytes_used: { Args: Record<PropertyKey, never>; Returns: number };
      claim_voice_token_mint: { Args: Record<PropertyKey, never>; Returns: undefined };
      list_hub_members_visible: {
        Args: { p_hub_id: string };
        Returns: {
          user_id: string;
          role: string;
          username: string;
          tag: string;
          status: string;
          status_text: string | null;
        }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
