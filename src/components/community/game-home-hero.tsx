import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { HubCard } from "@/lib/mock-data";
import { GameIcon } from "@/components/game-icon";
import { resolveBannerUrl, resolveIconUrl } from "@/lib/game-artwork";
import { useT } from "@/lib/i18n";

export function GameHomeHero({
  game,
  onlineCount,
}: {
  game: HubCard;
  onlineCount: number;
}) {
  const { t } = useT();
  const banner = resolveBannerUrl({
    coverUrl: game.imageUrl,
    bannerUrl: game.bannerUrl,
  });

  return (
    <header className="relative shrink-0 overflow-hidden">
      <div className="relative h-[min(42dvh,320px)] w-full bg-surface-left">
        {banner ? (
          <img src={banner} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className={`absolute inset-0 ${game.tint}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-black/25" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3 pt-safe">
          <Link
            to="/"
            className="nx-press inline-flex min-h-11 items-center gap-1 rounded-xl border border-white/10 bg-black/35 px-3 text-sm font-medium text-white backdrop-blur-md"
          >
            <ChevronLeft className="size-4 rtl:rotate-180" />
            {t("community.backToMy")}
          </Link>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4 pb-5">
          <GameIcon
            src={resolveIconUrl({
              coverUrl: game.imageUrl,
              iconUrl: game.iconUrl,
            })}
            short={game.short}
            tint={game.tint}
            textTint={game.textTint}
            size="lg"
            className="shadow-[var(--nx-shadow-3)]"
          />
          <div className="min-w-0 flex-1 pb-0.5">
            <p className="nx-caption mb-1 text-accent">{t("community.gameHome")}</p>
            <h1 className="nx-display truncate text-2xl text-white md:text-3xl" dir="auto">
              {game.hubName}
            </h1>
            <p className="mt-1 text-sm text-stone-300">
              {onlineCount > 0
                ? t("community.statusOnline", { n: String(onlineCount) })
                : t("community.statusQuiet")}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
