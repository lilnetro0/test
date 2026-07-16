import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ListRowProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  className?: string;
  /** Soften row when item is already consumed (e.g. read notification) */
  muted?: boolean;
};

/**
 * Full-bleed interactive row. Min touch height 44px. Not a card.
 */
export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  onClick,
  disabled,
  className,
  muted,
}: ListRowProps) {
  const interactive = Boolean(onClick) && !disabled;
  const Comp = interactive ? "button" : "div";

  return (
    <Comp
      type={interactive ? "button" : undefined}
      onClick={interactive ? onClick : undefined}
      disabled={interactive ? disabled : undefined}
      className={cn(
        "flex w-full min-h-11 items-center gap-3 px-4 py-3 text-start transition-colors duration-[var(--nx-motion-fast)] ease-[var(--nx-motion-ease)]",
        interactive && "hover:bg-white/[0.03] active:bg-white/[0.05] active:scale-[0.995]",
        muted && "opacity-60",
        disabled && "pointer-events-none opacity-40",
        className,
      )}
    >
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="nx-label truncate" dir="auto">
          {title}
        </div>
        {subtitle ? (
          <p className="nx-caption mt-0.5 truncate" dir="auto">
            {subtitle}
          </p>
        ) : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </Comp>
  );
}
