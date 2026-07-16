import { Link } from "@tanstack/react-router";
import { Hash } from "lucide-react";
import type { TextChannel } from "@/lib/mock-data";
import { isLfgChannel } from "@/lib/lfg";
import { useT } from "@/lib/i18n";

export function FeaturedChannels({
  hubSlug,
  channels,
  channelPathSlug,
}: {
  hubSlug: string;
  channels: TextChannel[];
  channelPathSlug: (c: TextChannel) => string;
}) {
  const { t } = useT();

  return (
    <section className="px-4 pb-8" aria-label={t("community.textSection")}>
      <h2 className="nx-label mb-3 text-stone-400">{t("community.textSection")}</h2>
      <ul className="flex flex-col gap-2">
        {channels.map((c) => {
          const lfg = isLfgChannel(c);
          return (
            <li key={c.id}>
              <Link
                to="/c/$hubSlug/t/$channelSlug"
                params={{ hubSlug, channelSlug: channelPathSlug(c) }}
                className="nx-press flex min-h-14 items-center gap-3 rounded-2xl border border-border-subtle/70 bg-surface-mid/70 px-3 py-2.5 transition-colors hover:border-accent/35"
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                    lfg ? "bg-accent/15 text-accent" : "bg-white/5 text-stone-400"
                  }`}
                >
                  <Hash className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-medium text-white" dir="auto">
                      {c.name}
                    </span>
                    {lfg ? (
                      <span className="shrink-0 rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                        {t("home.lfgBadge")}
                      </span>
                    ) : null}
                  </span>
                  {c.topic ? (
                    <span className="mt-0.5 block truncate text-xs text-stone-500" dir="auto">
                      {c.topic}
                    </span>
                  ) : null}
                </span>
                {c.unread ? (
                  <span className="grid min-w-5 shrink-0 place-items-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">
                    {c.unread}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
