import { MicOff, Volume2 } from "lucide-react";
import type { VoiceChannel } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

function initials(name: string) {
  return name.slice(0, 2).toUpperCase() || "?";
}

export function VoiceRoomCard({
  room,
  joined,
  joining,
  onJoin,
}: {
  room: VoiceChannel;
  joined: boolean;
  joining?: boolean;
  onJoin: () => void;
}) {
  const { t } = useT();
  const count = room.members.length;
  const capacity = room.capacity ?? null;
  const full = capacity != null && count >= capacity;
  const status =
    joined
      ? t("community.voice.statusHere")
      : full
        ? t("community.voice.statusFull")
        : count > 0
          ? t("community.voice.statusLive")
          : t("community.voice.statusEmpty");

  const shown = room.members.slice(0, 5);
  const overflow = Math.max(0, count - shown.length);

  return (
    <article className="overflow-hidden rounded-2xl border border-border-subtle/80 bg-surface-mid/90 shadow-[var(--nx-shadow-2)]">
      <div className="flex items-start gap-3 p-4">
        <div
          className={`grid size-11 shrink-0 place-items-center rounded-xl ${
            count > 0 || joined ? "bg-online/15 text-online" : "bg-white/5 text-stone-500"
          }`}
        >
          <Volume2 className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-white" dir="auto">
                {room.name}
              </h3>
              <p className="nx-caption mt-0.5 text-stone-400">
                {capacity != null
                  ? t("community.voice.occupancyCap", {
                      n: String(count),
                      max: String(capacity),
                    })
                  : t("community.voice.occupancy", { n: String(count) })}
                {" · "}
                {status}
              </p>
            </div>
          </div>

          <ul className="mt-3 flex flex-wrap items-center gap-2">
            {count === 0 ? (
              <li className="text-xs text-stone-500">{t("community.voice.waiting")}</li>
            ) : (
              <>
                {shown.map((m) => (
                  <li
                    key={m.userId ?? m.name}
                    className="inline-flex max-w-[9rem] items-center gap-1.5 rounded-full border border-border-subtle/70 bg-black/25 py-1 pe-2.5 ps-1"
                  >
                    <span className="grid size-6 place-items-center rounded-full bg-white/10 text-[10px] font-semibold text-stone-200">
                      {initials(m.name)}
                    </span>
                    <span className="truncate text-xs text-stone-200" dir="auto">
                      {m.name}
                    </span>
                    {m.muted ? <MicOff className="size-3 shrink-0 text-stone-500" /> : null}
                  </li>
                ))}
                {overflow > 0 ? (
                  <li className="nx-caption rounded-full bg-white/5 px-2 py-1 text-stone-400">
                    +{overflow}
                  </li>
                ) : null}
              </>
            )}
          </ul>

          <div className="mt-4">
            <Button
              type="button"
              variant={joined ? "secondary" : "accent"}
              className="w-full"
              disabled={joining || joined || full}
              onClick={onJoin}
            >
              {joined
                ? t("home.joined")
                : full
                  ? t("community.voice.full")
                  : t("home.joinVoice")}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
