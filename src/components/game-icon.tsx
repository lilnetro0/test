import { cn } from "@/lib/utils";
import { GAME_ART_SIZES } from "@/lib/game-artwork";

/**
 * Square game icon / logo with clean tint+short fallback when no artwork.
 */
export function GameIcon({
  src,
  short,
  tint,
  textTint,
  className,
  imgClassName,
  size = "md",
}: {
  src?: string | null;
  short: string;
  tint?: string;
  textTint?: string;
  className?: string;
  imgClassName?: string;
  size?: "sm" | "md" | "lg";
}) {
  const box =
    size === "sm" ? "size-8 text-[9px]" : size === "lg" ? "size-12 text-xs" : "size-9 text-[10px]";

  if (src) {
    return (
      <div
        className={cn(
          "nx-ui-media relative shrink-0 overflow-hidden rounded-lg bg-stone-900",
          box,
          className,
        )}
      >
        <img
          src={src}
          alt=""
          width={size === "lg" ? 48 : size === "sm" ? 32 : 36}
          height={size === "lg" ? 48 : size === "sm" ? 32 : 36}
          sizes={GAME_ART_SIZES.icon}
          loading="lazy"
          decoding="async"
          draggable={false}
          className={cn("nx-no-drag size-full object-cover", imgClassName)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-lg font-display font-semibold",
        box,
        tint ?? "bg-stone-500/20",
        textTint ?? "text-stone-300",
        className,
      )}
      aria-hidden
    >
      {short}
    </div>
  );
}
