import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Headphones, PhoneOff, Monitor, Video, Settings2, Flag } from "lucide-react";
import { toast } from "sonner";
import { getVoiceClient } from "@/lib/voice";
import type { VoiceParticipant } from "@/lib/voice/types";
import { useNavigate } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Persistent voice-connection dock. Shown when connected to a voice channel.
 * Mute/deafen/leave/camera/share route through VoiceClient (stub or LiveKit).
 * Compact on narrow screens so Composer + bottom dock stay usable.
 */
export function VoiceDock({
  channelName,
  gameName,
  onDisconnect,
  onReport,
}: {
  channelName: string;
  gameName: string;
  onDisconnect: () => void;
  /** AF12 — receives current LiveKit roster (may be empty in stub mode) */
  onReport?: (participants: VoiceParticipant[]) => void;
}) {
  const voice = getVoiceClient();
  const navigate = useNavigate();
  const { t } = useT();
  const compact = useIsMobile();
  const onDisconnectRef = useRef(onDisconnect);
  onDisconnectRef.current = onDisconnect;
  const [muted, setMuted] = useState(() => voice.getSession()?.localMuted ?? false);
  const [deafened, setDeafened] = useState(() => voice.getSession()?.localDeafened ?? false);
  const [sharing, setSharing] = useState(false);
  const [video, setVideo] = useState(false);
  const [live, setLive] = useState(() => voice.getSession()?.live ?? false);
  const [reconnecting, setReconnecting] = useState(
    () => voice.getSession()?.reconnecting ?? false,
  );
  const [participantCount, setParticipantCount] = useState(
    () => voice.getSession()?.participants.length ?? 1,
  );

  useEffect(() => {
    return voice.onSessionChange?.((session) => {
      if (!session) {
        onDisconnectRef.current();
        return;
      }
      setLive(session.live);
      setReconnecting(Boolean(session.reconnecting));
      setParticipantCount(session.participants.length);
      if (typeof session.localMuted === "boolean") setMuted(session.localMuted);
      if (typeof session.localDeafened === "boolean") setDeafened(session.localDeafened);
    });
  }, [voice]);

  return (
    <div
      className={`border-t border-border-subtle/80 bg-background ${
        compact ? "px-2 py-1" : "p-3"
      }`}
    >
      <div className={`flex items-center ${compact ? "gap-2" : "gap-3"}`}>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div
            className={`grid shrink-0 place-items-center rounded-lg ${
              compact ? "size-7" : "size-8"
            } ${
              reconnecting
                ? "bg-amber-500/15 text-amber-200"
                : live
                  ? "bg-online/15 text-online"
                  : "bg-amber-500/15 text-amber-200"
            }`}
          >
            <span
              className={`size-2 animate-pulse rounded-full ${
                reconnecting
                  ? "bg-amber-400"
                  : live
                    ? "bg-online shadow-[var(--shadow-glow-online)]"
                    : "bg-amber-400"
              }`}
            />
          </div>
          <div className="min-w-0">
            <p className={`truncate font-semibold text-white ${compact ? "text-[11px]" : "text-xs"}`}>
              {channelName}
            </p>
            {!compact && (
              <p
                className={`nx-caption truncate ${
                  reconnecting
                    ? "text-amber-200/90"
                    : live
                      ? "text-online"
                      : "text-amber-200/90"
                }`}
              >
                {reconnecting
                  ? t("voice.reconnecting")
                  : live
                    ? `${gameName} · LiveKit · ${participantCount || 1}`
                    : `${gameName} · ${t("voice.preview")}`}
              </p>
            )}
          </div>
        </div>
        <div className={`flex shrink-0 items-center ${compact ? "gap-0.5" : "gap-1"}`}>
          {!compact && (
            <>
              <DockButton
                active={sharing}
                compact={compact}
                onClick={() => {
                  const next = !sharing;
                  setSharing(next);
                  void voice.setScreenShareEnabled(next).catch((e: Error) => {
                    setSharing(!next);
                    toast.error(e.message || t("voice.err.screen"));
                  });
                  if (live) toast(next ? t("voice.toast.shareOn") : t("voice.toast.shareOff"));
                  else toast(next ? t("voice.toast.shareMockOn") : t("voice.toast.shareMockOff"));
                }}
                label={t("voice.screenShare")}
              >
                <Monitor className="size-4" />
              </DockButton>
              <DockButton
                active={video}
                compact={compact}
                onClick={() => {
                  const next = !video;
                  setVideo(next);
                  void voice.setCameraEnabled(next).catch((e: Error) => {
                    setVideo(!next);
                    toast.error(e.message || t("voice.err.camera"));
                  });
                  if (!live) toast(next ? t("voice.toast.camMockOn") : t("voice.toast.camMockOff"));
                }}
                label={t("voice.camera")}
              >
                <Video className="size-4" />
              </DockButton>
            </>
          )}
          <DockButton
            active={muted}
            danger={muted}
            compact={compact}
            onClick={() => {
              const next = !muted;
              setMuted(next);
              if (!next) setDeafened(false);
              void voice.setMuted(next).catch((e: Error) => {
                setMuted(!next);
                toast.error(e.message || t("voice.err.mute"));
              });
            }}
            label={muted ? t("voice.unmute") : t("voice.mute")}
          >
            {muted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
          </DockButton>
          <DockButton
            active={deafened}
            danger={deafened}
            compact={compact}
            onClick={() => {
              const next = !deafened;
              setDeafened(next);
              if (next) setMuted(true);
              void voice.setDeafened(next).catch((e: Error) => {
                setDeafened(!next);
                toast.error(e.message || t("voice.err.deafen"));
              });
            }}
            label={deafened ? t("voice.undeafen") : t("voice.deafen")}
          >
            <Headphones className={`size-4 ${deafened ? "line-through" : ""}`} />
          </DockButton>
          {onReport ? (
            <DockButton
              compact={compact}
              onClick={() =>
                onReport(voice.getSession()?.participants ?? [])
              }
              label={t("report.voiceAria")}
            >
              <Flag className="size-4" />
            </DockButton>
          ) : null}
          {!compact && (
            <DockButton
              compact={compact}
              onClick={() => {
                void navigate({ to: "/settings" });
              }}
              label={t("voice.settingsAria")}
            >
              <Settings2 className="size-4" />
            </DockButton>
          )}
          <button
            onClick={() => {
              void voice.leaveVoiceChannel();
              onDisconnect();
              toast(t("voice.disconnected"));
            }}
            title={t("voice.disconnect")}
            aria-label={t("voice.disconnect")}
            className={`grid place-items-center rounded-lg bg-danger/15 text-danger transition-colors hover:bg-danger/25 ${
              compact ? "size-8" : "size-9"
            }`}
          >
            <PhoneOff className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function DockButton({
  children,
  active,
  danger,
  onClick,
  label,
  compact,
}: {
  children: React.ReactNode;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  label: string;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`grid place-items-center rounded-lg transition-colors ${
        compact ? "size-8" : "size-9"
      } ${
        danger
          ? "bg-danger/15 text-danger hover:bg-danger/25"
          : active
            ? "bg-accent/15 text-accent"
            : "text-stone-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
