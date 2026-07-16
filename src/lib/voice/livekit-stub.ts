import type { JoinVoiceInput, VoiceClient, VoiceSession } from "./types";
import { enterVoiceAudioSession, leaveVoiceAudioSession } from "./native-audio";

/**
 * No-op voice client for mock mode / when LiveKit env is missing.
 * Mimics connection so VoiceDock UI can be exercised without a LiveKit project.
 */

let session: VoiceSession | null = null;
const listeners = new Set<(s: VoiceSession | null) => void>();

function emit() {
  for (const cb of listeners) cb(session);
}

export const livekitStubClient: VoiceClient = {
  async joinVoiceChannel(input: JoinVoiceInput) {
    session = {
      channelId: input.channelId,
      channelName: input.channelName,
      hubName: input.hubName,
      roomName: input.roomName,
      connected: true,
      live: false,
      reconnecting: false,
      localMuted: false,
      localDeafened: false,
      participants: [],
    };
    void enterVoiceAudioSession();
    emit();
    return session;
  },

  async leaveVoiceChannel() {
    session = null;
    void leaveVoiceAudioSession();
    emit();
  },

  async setMuted() {},
  async setDeafened() {},
  async setCameraEnabled() {},
  async setScreenShareEnabled() {},

  getSession() {
    return session;
  },

  onSessionChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
};
