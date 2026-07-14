import {
  ConnectionState,
  Room,
  RoomEvent,
  Track,
  type RemoteParticipant,
  type RemoteTrackPublication,
} from "livekit-client";
import { createVoiceToken } from "./create-voice-token";
import { livekitStubClient } from "./livekit-stub";
import type { JoinVoiceInput, VoiceClient, VoiceParticipant, VoiceSession } from "./types";

let room: Room | null = null;
let session: VoiceSession | null = null;
let deafened = false;
let joinGeneration = 0;
/** Serialize join/leave so a second join cannot disconnect mid-publish. */
let opQueue: Promise<unknown> = Promise.resolve();
const listeners = new Set<(s: VoiceSession | null) => void>();

function emit() {
  for (const cb of listeners) cb(session);
}

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = opQueue.then(fn, fn);
  opQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function mapParticipant(p: RemoteParticipant | { identity: string; name?: string; isMicrophoneEnabled: boolean; isSpeaking: boolean }): VoiceParticipant {
  return {
    identity: p.identity,
    name: p.name || p.identity,
    muted: !p.isMicrophoneEnabled,
    deafened: false,
    speaking: p.isSpeaking,
  };
}

function syncParticipants() {
  if (!room || !session) return;
  const locals: VoiceParticipant[] = [
    mapParticipant({
      identity: room.localParticipant.identity,
      name: room.localParticipant.name,
      isMicrophoneEnabled: room.localParticipant.isMicrophoneEnabled,
      isSpeaking: room.localParticipant.isSpeaking,
    }),
  ];
  const remotes = Array.from(room.remoteParticipants.values()).map(mapParticipant);
  session = { ...session, participants: [...locals, ...remotes] };
  emit();
}

function applyDeafenVolume() {
  if (!room) return;
  const vol = deafened ? 0 : 1;
  for (const p of room.remoteParticipants.values()) {
    for (const pub of p.trackPublications.values()) {
      if (pub.track?.kind === Track.Kind.Audio) {
        pub.track.setVolume(vol);
      }
    }
  }
}

function clearSessionState() {
  room = null;
  session = null;
  deafened = false;
  emit();
}

async function waitUntilConnected(next: Room, timeoutMs = 20_000): Promise<void> {
  if (next.state === ConnectionState.Connected) return;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Timed out waiting for LiveKit connection"));
    }, timeoutMs);
    const onConnected = () => {
      cleanup();
      resolve();
    };
    const onDisconnected = () => {
      cleanup();
      reject(new Error("Disconnected before voice was ready"));
    };
    const cleanup = () => {
      clearTimeout(timer);
      next.off(RoomEvent.Connected, onConnected);
      next.off(RoomEvent.Disconnected, onDisconnected);
    };
    next.on(RoomEvent.Connected, onConnected);
    next.on(RoomEvent.Disconnected, onDisconnected);
  });
}

async function enableMicSafely(next: Room): Promise<void> {
  try {
    await next.localParticipant.setMicrophoneEnabled(true);
  } catch (first) {
    // ICE/publisher PC can lag behind signaling; one retry after settle.
    await new Promise((r) => setTimeout(r, 400));
    if (next.state !== ConnectionState.Connected) {
      throw first instanceof Error ? first : new Error(String(first));
    }
    try {
      await next.localParticipant.setMicrophoneEnabled(true);
    } catch {
      // Stay in the room muted — hear others; user can unmute from VoiceDock.
      console.warn("[voice] Microphone publish failed; joined muted", first);
    }
  }
}

async function connectLiveKit(input: JoinVoiceInput): Promise<VoiceSession> {
  if (!input.accessToken) {
    throw new Error("Sign in to join live voice");
  }

  const result = await createVoiceToken({
    data: {
      accessToken: input.accessToken,
      channelId: input.threadId ? undefined : input.channelId,
      threadId: input.threadId,
      roomName: input.roomName,
      displayName: input.displayName,
    },
  });

  if (!result.ok) {
    if (result.code === "NOT_CONFIGURED") {
      return livekitStubClient.joinVoiceChannel(input);
    }
    throw new Error(result.error);
  }

  const gen = ++joinGeneration;
  await leaveInternal(false);
  if (gen !== joinGeneration) {
    throw new Error("Voice join cancelled");
  }

  const next = new Room({
    adaptiveStream: true,
    dynacast: true,
    disconnectOnPageLeave: true,
  });

  const onDisconnected = () => {
    if (room === next) clearSessionState();
  };

  next
    .on(RoomEvent.ParticipantConnected, () => syncParticipants())
    .on(RoomEvent.ParticipantDisconnected, () => syncParticipants())
    .on(RoomEvent.ActiveSpeakersChanged, () => syncParticipants())
    .on(RoomEvent.TrackMuted, () => syncParticipants())
    .on(RoomEvent.TrackUnmuted, () => syncParticipants())
    .on(RoomEvent.TrackSubscribed, (_track, publication: RemoteTrackPublication) => {
      if (deafened && publication.track?.kind === Track.Kind.Audio) {
        publication.track.setVolume(0);
      }
      syncParticipants();
    })
    .on(RoomEvent.Disconnected, onDisconnected);

  try {
    await next.prepareConnection(result.url, result.token);
    if (gen !== joinGeneration) {
      await next.disconnect();
      throw new Error("Voice join cancelled");
    }

    await next.connect(result.url, result.token, { autoSubscribe: true });
    await waitUntilConnected(next);

    if (gen !== joinGeneration) {
      await next.disconnect();
      throw new Error("Voice join cancelled");
    }

    await enableMicSafely(next);

    if (gen !== joinGeneration) {
      await next.disconnect();
      throw new Error("Voice join cancelled");
    }

    room = next;
    session = {
      channelId: input.channelId,
      channelName: input.channelName,
      roomName: result.roomName,
      connected: true,
      live: true,
      participants: [],
    };
    syncParticipants();
    return session;
  } catch (err) {
    next.removeAllListeners();
    try {
      await next.disconnect();
    } catch {
      /* ignore */
    }
    if (room === next) clearSessionState();
    throw err;
  }
}

async function leaveInternal(bumpGeneration = true) {
  if (bumpGeneration) joinGeneration += 1;
  const current = room;
  room = null;
  session = null;
  deafened = false;
  emit();
  if (current) {
    current.removeAllListeners();
    try {
      await current.disconnect();
    } catch {
      /* ignore */
    }
  }
}

export const livekitVoiceClient: VoiceClient = {
  async joinVoiceChannel(input) {
    return enqueue(async () => {
      try {
        return await connectLiveKit(input);
      } catch (err) {
        await leaveInternal();
        throw err;
      }
    });
  },

  async leaveVoiceChannel() {
    return enqueue(() => leaveInternal());
  },

  async setMuted(muted) {
    if (!room || room.state !== ConnectionState.Connected) return;
    try {
      await room.localParticipant.setMicrophoneEnabled(!muted);
      syncParticipants();
    } catch (err) {
      console.warn("[voice] setMuted failed", err);
    }
  },

  async setDeafened(next) {
    deafened = next;
    if (!room || room.state !== ConnectionState.Connected) return;
    try {
      if (next) {
        await room.localParticipant.setMicrophoneEnabled(false);
      }
      applyDeafenVolume();
      syncParticipants();
    } catch (err) {
      console.warn("[voice] setDeafened failed", err);
    }
  },

  async setCameraEnabled(enabled) {
    if (!room || room.state !== ConnectionState.Connected) return;
    await room.localParticipant.setCameraEnabled(enabled);
  },

  async setScreenShareEnabled(enabled) {
    if (!room || room.state !== ConnectionState.Connected) return;
    await room.localParticipant.setScreenShareEnabled(enabled);
  },

  getSession() {
    return session;
  },

  onSessionChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
};
