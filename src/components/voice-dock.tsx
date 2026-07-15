import { useEffect, useState } from "react";
import { Mic, MicOff, Headphones, PhoneOff, Monitor, Video, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { getVoiceClient } from "@/lib/voice";
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
}: {
  channelName: string;
  gameName: string;
  onDisconnect: () => void;
}) {
  const voice = getVoiceClient();
  const navigate = useNavigate();
  const { t } = useT();
  const compact = useIsMobile();
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [video, setVideo] = useState(false);
  const [live, setLive] = useState(() => voice.getSession()?.live ?? false);
  const [participantCount, setParticipantCount] = useState(
    () => voice.getSession()?.participants.length ?? 1,
  );

  useEffect(() => {
    return voice.onSessionChange?.((session) => {
      setLive(session?.live ?? false);
      setParticipantCount(session?.participants.length ?? 0);
    });
  }, [voice]);

  return (
    <div
      className={`border-t border-border-subtle bg-background/80 backdrop-blur-md ${
        compact ? "px-2 py-1.5" : "p-3"
      }`}
    >
      <div className={`flex items-center ${compact ? "gap-2" : "gap-3"}`}>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div
            className={`grid shrink-0 place-items-center rounded-lg ${
              compact ? "size-7" : "size-8"
            } ${live ? "bg-online/15 text-online" : "bg-amber-500/15 text-amber-200"}`}
          >
            <span
              className={`size-2 animate-pulse rounded-full ${
                live ? "bg-online shadow-[var(--shadow-glow-online)]" : "bg-amber-400"
              }`}
            />
          </div>
          <div className="min-w-0">
            <p className={`truncate font-bold text-white ${compact ? "text-[11px]" : "text-xs"}`}>
              {channelName}
            </p>
            {!compact && (
              <p
                className={`truncate text-[10px] uppercase tracking-tight ${
                  live ? "text-online" : "text-amber-200/90"
                }`}
              >
                {live
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
                    toast.error(e.message || "Screen share failed");
                  });
                  if (live) toast(next ? "Screen sharing started" : "Stopped screen share");
                  else toast(next ? "Screen share (mock)" : "Stopped screen share");
                }}
                label="Screen share"
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
                    toast.error(e.message || "Camera failed");
                  });
                  if (!live) toast(next ? "Camera on (mock)" : "Camera off");
                }}
                label="Camera"
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
              void voice.setMuted(next);
            }}
            label={muted ? "Unmute" : "Mute"}
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
              void voice.setDeafened(next);
            }}
            label={deafened ? "Undeafen" : "Deafen"}
          >
            <Headphones className={`size-4 ${deafened ? "line-through" : ""}`} />
          </DockButton>
          {!compact && (
            <DockButton
              compact={compact}
              onClick={() => {
                void navigate({ to: "/settings" });
              }}
              label="Voice settings"
            >
              <Settings2 className="size-4" />
            </DockButton>
          )}
          <button
            onClick={() => {
              void voice.leaveVoiceChannel();
              onDisconnect();
              toast("Disconnected from voice");
            }}
            title="Disconnect"
            aria-label="Disconnect"
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
