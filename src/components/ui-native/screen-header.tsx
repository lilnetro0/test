import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Standard screen top bar — title + optional trailing actions.
 * Prefer this over ad-hoc `h1 uppercase` headers (Phase B).
 */
export function ScreenHeader({
  title,
  subtitle,
  leading,
  trailing,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-border-subtle px-4 py-3 md:min-h-16 md:px-6",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {leading}
        <div className="min-w-0">
          <h1 className="nx-title truncate">{title}</h1>
          {subtitle ? <p className="nx-caption mt-0.5 truncate">{subtitle}</p> : null}
        </div>
      </div>
      {trailing ? <div className="flex shrink-0 items-center gap-2">{trailing}</div> : null}
    </header>
  );
}
