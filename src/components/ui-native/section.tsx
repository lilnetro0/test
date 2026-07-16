import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Grouped content block. Spacing separates sections — no card chrome by default.
 */
export function Section({
  title,
  children,
  className,
  contentClassName,
}: {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section className={cn("space-y-2", className)}>
      {title ? <h2 className="nx-section px-1">{title}</h2> : null}
      <div className={cn("space-y-0.5", contentClassName)}>{children}</div>
    </section>
  );
}
