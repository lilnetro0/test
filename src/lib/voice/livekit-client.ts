import {
  ConnectionState,
  Room,
  RoomEvent,
  Track,
  type RemoteParticipant,
  type RemoteTrackPublication,
} from "livekit-client";
import { createVoiceToken } from "./create-voice-token";
import { leaveVoiceAudioSession, enterVoiceAudioSession } from "./native-audio";
import { livekitStubClient } from "./livekit-stub";
import type { JoinVoiceInput, VoiceClient, VoiceParticipant, VoiceSession } from "./types";

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_BASE_MS = 1200;

let room: Room | null = null;
let session: VoiceSession | null = null;
let deafened = false;
let preferredMuted = false;
let lastJoinInput: JoinVoiceInput | null = null;
let intentionalLeave = false;
let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
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

function patchSession(partial: Partial<VoiceSession>) {
  if (!session) return;
  session = {
    ...session,
    ...partial,
    localMuted: preferredMuted || deafened,
    localDeafened: deafened,
  };
  emit();
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
  session = {
    ...session,
    participants: [...locals, ...remotes],
    localMuted: preferredMuted || deafened,
    localDeafened: deafened,
    reconnecting: false,
  };
  emit();
}

function applyDeafenVolume() {
  if (!room) return;
  const vol = deafened ? 0 : 1;
  for (const p of room.remoteParticipants.values()) {
    for (const pub of p.trackPublications.values()) {
      if (pub.track?.kind === Track.Kind.Audio) {
        (pub.track as unknown as { setVolume: (v: number) => void }).setVolume(vol);
      }
    }
  }
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function clearSessionState() {
  clearReconnectTimer();
  room = null;
  session = null;
  deafened = false;
  preferredMuted = false;
  reconnectAttempts = 0;
  void leaveVoiceAudioSession();
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
  if (preferredMuted || deafened) {
    try {
      await next.localParticipant.setMicrophoneEnabled(false);
    } catch {
      /* stay as-is */
    }
    return;
  }
  try {
    await next.localParticipant.setMicrophoneEnabled(true);
  } catch (first) {
    await new Promise((r) => setTimeout(r, 400));
    if (next.state !== ConnectionState.Connected) {
      throw first instanceof Error ? first : new Error(String(first));
    }
    try {
      await next.localParticipant.setMicrophoneEnabled(true);
    } catch {
      preferredMuted = true;
      console.warn("[voice] Microphone publish failed; joined muted", first);
    }
  }
}

function scheduleReconnect(fromRoom: Room) {
  if (intentionalLeave || !lastJoinInput?.accessToken) {
    if (room === fromRoom || room === null) clearSessionState();
    return;
  }
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.warn("[voice] Reconnect attempts exhausted");
    if (room === fromRoom || room === null) clearSessionState();
    return;
  }

  reconnectAttempts += 1;
  const delay = RECONNECT_BASE_MS * reconnectAttempts;
  patchSession({ connected: false, reconnecting: true });

  clearReconnectTimer();
  reconnectTimer = setTimeout(() => {
    void enqueue(async () => {
      if (intentionalLeave || !lastJoinInput) {
        clearSessionState();
        return;
      }
      try {
        await connectLiveKit(lastJoinInput, { isReconnect: true });
        reconnectAttempts = 0;
      } catch (err) {
        console.warn("[voice] Reconnect failed", err);
        scheduleReconnect(fromRoom);
      }
    });
  }, delay);
}

function wireRoomEvents(next: Room) {
  const onDisconnected = () => {
    if (room !== next && room !== null) return;
    room = null;
    if (intentionalLeave) {
      clearSessionState();
      return;
    }
    scheduleReconnect(next);
  };

  next
    .on(RoomEvent.ParticipantConnected, () => syncParticipants())
    .on(RoomEvent.ParticipantDisconnected, () => syncParticipants())
    .on(RoomEvent.ActiveSpeakersChanged, () => syncParticipants())
    .on(RoomEvent.TrackMuted, () => syncParticipants())
    .on(RoomEvent.TrackUnmuted, () => syncParticipants())
    .on(RoomEvent.LocalTrackPublished, () => syncParticipants())
    .on(RoomEvent.LocalTrackUnpublished, () => syncParticipants())
    .on(RoomEvent.Reconnecting, () => patchSession({ reconnecting: true, connected: false }))
    .on(RoomEvent.Reconnected, () => {
      reconnectAttempts = 0;
      patchSession({ reconnecting: false, connected: true });
      syncParticipants();
      applyDeafenVolume();
    })
    .on(RoomEvent.TrackSubscribed, (_track, publication: RemoteTrackPublication) => {
      if (deafened && publication.track?.kind === Track.Kind.Audio) {
        (publication.track as unknown as { setVolume: (v: number) => void }).setVolume(0);
      }
      syncParticipants();
    })
    .on(RoomEvent.Disconnected, onDisconnected);
}

async function connectLiveKit(
  input: JoinVoiceInput,
  opts?: { isReconnect?: boolean },
): Promise<VoiceSession> {
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
    const prefix =
      result.code === "AUTH"
        ? "Sign in required"
        : result.code === "FORBIDDEN"
          ? "Not allowed"
          : result.code === "RATE_LIMITED"
            ? "Slow down"
            : "Voice error";
    throw new Error(`${prefix}: ${result.error}`);
  }

  const gen = ++joinGeneration;
  intentionalLeave = false;
  lastJoinInput = { ...input };
  await leaveInternal(false, { keepPrefs: opts?.isReconnect });
  if (gen !== joinGeneration) {
    throw new Error("Voice join cancelled");
  }

  const next = new Room({
    adaptiveStream: true,
    dynacast: true,
    disconnectOnPageLeave: true,
  });

  wireRoomEvents(next);

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
    applyDeafenVolume();

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
      reconnecting: false,
      localMuted: preferredMuted || deafened,
      localDeafened: deafened,
      participants: [],
    };
    void enterVoiceAudioSession();
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

async function leaveInternal(
  bumpGeneration = true,
  opts?: { keepPrefs?: boolean },
) {
  if (bumpGeneration) joinGeneration += 1;
  clearReconnectTimer();
  const current = room;
  room = null;
  session = null;
  if (!opts?.keepPrefs) {
    deafened = false;
    preferredMuted = false;
    lastJoinInput = null;
    reconnectAttempts = 0;
  }
  emit();
  if (!opts?.keepPrefs) {
    void leaveVoiceAudioSession();
  }
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
        reconnectAttempts = 0;
        intentionalLeave = false;
        return await connectLiveKit(input);
      } catch (err) {
        await leaveInternal();
        throw err;
      }
    });
  },

  async leaveVoiceChannel() {
    return enqueue(async () => {
      intentionalLeave = true;
      clearReconnectTimer();
      lastJoinInput = null;
      await leaveInternal();
    });
  },

  async setMuted(muted) {
    preferredMuted = muted;
    if (muted === false) deafened = false;
    if (!room || room.state !== ConnectionState.Connected) {
      patchSession({});
      return;
    }
    try {
      await room.localParticipant.setMicrophoneEnabled(!(muted || deafened));
      syncParticipants();
    } catch (err) {
      console.warn("[voice] setMuted failed", err);
      throw err instanceof Error ? err : new Error("Could not change mute");
    }
  },

  async setDeafened(next) {
    deafened = next;
    if (next) preferredMuted = true;
    if (!room || room.state !== ConnectionState.Connected) {
      patchSession({});
      return;
    }
    try {
      if (next) {
        await room.localParticipant.setMicrophoneEnabled(false);
      } else if (!preferredMuted) {
        await room.localParticipant.setMicrophoneEnabled(true);
      }
      applyDeafenVolume();
      syncParticipants();
    } catch (err) {
      console.warn("[voice] setDeafened failed", err);
      throw err instanceof Error ? err : new Error("Could not change deafen");
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
