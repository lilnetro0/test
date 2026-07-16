import { Link } from "@tanstack/react-router";
import { Compass, GripVertical } from "lucide-react";
import type { HubCard } from "@/lib/mock-data";
import { GameIcon } from "@/components/game-icon";
import { resolveBannerUrl, resolveCoverUrl, resolveIconUrl } from "@/lib/game-artwork";
import { useT } from "@/lib/i18n";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export function MyCommunitiesList({
  hubs,
  lastHub,
  onReorder,
  dragId,
  setDragId,
}: {
  hubs: HubCard[];
  lastHub: string | null;
  onReorder: (targetId: string) => void;
  dragId: string | null;
  setDragId: (id: string | null) => void;
}) {
  const { t } = useT();

  if (!hubs.length) {
    return (
      <EmptyState
        title={t("community.my.emptyTitle")}
        body={t("community.my.emptyBody")}
        action={
          <Button asChild variant="accent">
            <Link to="/discover">{t("community.my.find")}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3 p-4 pb-8">
      {hubs.map((hub) => {
        const banner = resolveBannerUrl({
          coverUrl: hub.imageUrl,
          bannerUrl: hub.bannerUrl,
        });
        const cover = resolveCoverUrl({
          coverUrl: hub.imageUrl,
          bannerUrl: hub.bannerUrl,
        });
        const isResume = lastHub === hub.id;
        return (
          <li key={hub.id}>
            <div
              draggable
              onDragStart={() => setDragId(hub.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onReorder(hub.id)}
              onDragEnd={() => setDragId(null)}
              className={`overflow-hidden rounded-2xl border border-border-subtle/80 bg-surface-mid/80 shadow-[var(--nx-shadow-2)] transition-opacity ${
                dragId === hub.id ? "opacity-50" : ""
              }`}
            >
              <Link
                to="/c/$hubSlug"
                params={{ hubSlug: hub.id }}
                className="nx-press block"
              >
                <div className="relative h-28 w-full overflow-hidden bg-surface-left">
                  {(banner || cover) && (
                    <img
                      src={banner || cover || undefined}
                      alt=""
                      className="absolute inset-0 size-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-3">
                    <GameIcon
                      src={resolveIconUrl({
                        coverUrl: hub.imageUrl,
                        iconUrl: hub.iconUrl,
                      })}
                      short={hub.short}
                      tint={hub.tint}
                      textTint={hub.textTint}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="nx-display truncate text-lg text-white" dir="auto">
                        {hub.hubName}
                      </p>
                      <p className="nx-caption text-stone-300">
                        {t("community.my.online", { n: hub.activeCount })}
                        {isResume ? ` · ${t("community.my.resume")}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
              <div className="flex items-center justify-between gap-2 border-t border-border-subtle/60 px-3 py-2">
                <span className="nx-caption text-stone-500" dir="auto">
                  {hub.name}
                </span>
                <button
                  type="button"
                  className="grid size-9 place-items-center text-stone-500 hover:text-stone-300"
                  aria-label={t("community.my.reorder")}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <GripVertical className="size-4" />
                </button>
              </div>
            </div>
          </li>
        );
      })}
      <li className="pt-2">
        <Button asChild variant="secondary" className="w-full">
          <Link to="/discover" className="inline-flex items-center justify-center gap-2">
            <Compass className="size-4" />
            {t("community.my.find")}
          </Link>
        </Button>
      </li>
    </ul>
  );
}
