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

  const communityLabel = session.hubName?.trim() || t("community.voiceSection");
  let statusHint = t("voice.status.connected");
  if (session.micPermissionDenied) statusHint = t("voice.status.micDenied");
  else if (session.reconnecting) statusHint = t("voice.reconnecting");
  else if (!session.live) statusHint = t("voice.preview");

  return (
    <div className="shrink-0" role="status" aria-live="polite">
      <VoiceDock
        channelName={session.channelName}
        gameName={`${communityLabel} · ${statusHint}`}
        communityName={session.hubName}
        reconnecting={Boolean(session.reconnecting)}
        micDenied={Boolean(session.micPermissionDenied)}
        onDisconnect={() => {
          /* VoiceDock already calls leaveVoiceChannel; session change clears UI */
        }}
      />
    </div>
  );
}
