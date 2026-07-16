import { useEffect, useState } from "react";
import { VoiceDock } from "@/components/voice-dock";
import { getVoiceClient } from "@/lib/voice";
import type { VoiceSession } from "@/lib/voice/types";
import { useT } from "@/lib/i18n";

/**
 * App-wide voice connection bar. Session is owned by getVoiceClient();
 * this only mirrors UI so voice survives community ↔ chat ↔ tabs.
 */
export function GlobalVoiceBar() {
  const { t } = useT();
  const [session, setSession] = useState<VoiceSession | null>(() =>
    getVoiceClient().getSession(),
  );

  useEffect(() => {
    setSession(getVoiceClient().getSession());
    return getVoiceClient().onSessionChange?.((next) => {
      setSession(next);
    });
  }, []);

  if (!session?.connected) return null;

  return (
    <div className="shrink-0">
      <VoiceDock
        channelName={session.channelName}
        gameName={session.live ? t("community.voiceSection") : t("voice.preview")}
        onDisconnect={() => {
          /* VoiceDock already calls leaveVoiceChannel; session change clears UI */
        }}
      />
    </div>
  );
}
