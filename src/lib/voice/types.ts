/**
 * Voice abstraction for LiveKit.
 * UI talks only to this interface — stub ↔ LiveKit without redesigning VoiceDock.
 */

export type VoiceParticipant = {
  identity: string;
  name: string;
  muted: boolean;
  deafened: boolean;
  speaking: boolean;
};

export type VoiceSession = {
  channelId: string;
  channelName: string;
  roomName: string;
  connected: boolean;
  /** true when connected via LiveKit (not stub) */
  live: boolean;
  participants: VoiceParticipant[];
};

export type JoinVoiceInput = {
  channelId: string;
  channelName: string;
  roomName: string;
  /** DM thread UUID — uses LiveKit room nexus-dm-{threadId} */
  threadId?: string;
  /** Supabase access token — required for live join */
  accessToken?: string | null;
  displayName?: string;
};

export type VoiceClient = {
  joinVoiceChannel: (input: JoinVoiceInput) => Promise<VoiceSession>;
  leaveVoiceChannel: () => Promise<void>;
  setMuted: (muted: boolean) => Promise<void>;
  setDeafened: (deafened: boolean) => Promise<void>;
  setCameraEnabled: (enabled: boolean) => Promise<void>;
  setScreenShareEnabled: (enabled: boolean) => Promise<void>;
  getSession: () => VoiceSession | null;
  onSessionChange?: (cb: (session: VoiceSession | null) => void) => () => void;
};
