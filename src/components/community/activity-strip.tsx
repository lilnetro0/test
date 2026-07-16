import { Hash, Volume2 } from "lucide-react";
import { useT } from "@/lib/i18n";

export function ActivityStrip({
  voiceLiveCount,
  totalUnread,
  hasLfg,
}: {
  voiceLiveCount: number;
  totalUnread: number;
  hasLfg: boolean;
}) {
  const { t } = useT();

  return (
    <section
      className="mx-4 mt-4 flex flex-wrap gap-2 rounded-2xl border border-border-subtle/70 bg-white/[0.03] p-3"
      aria-label={t("community.happening")}
    >
      <span className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-online/10 px-3 text-xs font-medium text-online">
        <Volume2 className="size-3.5" />
        {t("community.activity.voice", { n: String(voiceLiveCount) })}
      </span>
      <span className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-accent/10 px-3 text-xs font-medium text-accent">
        <Hash className="size-3.5" />
        {t("community.activity.unread", { n: String(totalUnread) })}
      </span>
      {hasLfg && (
        <span className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-amber-500/10 px-3 text-xs font-medium text-amber-200">
          {t("community.activity.lfg")}
        </span>
      )}
    </section>
  );
}
