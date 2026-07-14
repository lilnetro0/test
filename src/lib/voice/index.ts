import { shouldUseMockData } from "@/lib/supabase/env";
import { livekitStubClient } from "./livekit-stub";
import { livekitVoiceClient } from "./livekit-client";
import type { VoiceClient } from "./types";

export type {
  VoiceClient,
  VoiceSession,
  VoiceParticipant,
  JoinVoiceInput,
} from "./types";

/**
 * Mock data mode → stub.
 * Live mode → LiveKit client (falls back to stub join if LIVEKIT_* secrets are unset).
 */
export function getVoiceClient(): VoiceClient {
  if (shouldUseMockData()) return livekitStubClient;
  return livekitVoiceClient;
}

export { livekitStubClient } from "./livekit-stub";
