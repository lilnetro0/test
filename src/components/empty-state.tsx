import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared empty surface — intentional, calm, one purpose + CTAs.
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  primaryAction,
  secondaryAction,
  className,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  /** @deprecated Prefer primaryAction / secondaryAction */
  action?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
}) {
  const actions = primaryAction || secondaryAction || action;

  return (
    <div className={cn("grid min-h-[280px] place-items-center px-6 py-10 text-center", className)}>
      <div className="max-w-[17.5rem]">
        <div className="relative mx-auto grid size-16 place-items-center">
          <div
            className="absolute inset-0 rounded-[1.25rem] bg-gradient-to-b from-accent/15 to-transparent"
            aria-hidden
          />
          <div className="relative grid size-16 place-items-center rounded-[1.25rem] border border-border-subtle/80 bg-surface-mid/80 text-accent shadow-[var(--nx-shadow-1)]">
            <Icon className="size-6 stroke-[1.5]" aria-hidden />
          </div>
        </div>
        <h3 className="nx-title mt-6 text-[1.05rem]">{title}</h3>
        <p className="nx-body mt-2.5 text-pretty">{body}</p>
        {actions ? (
          <div className="mt-6 flex flex-col items-stretch gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
            {primaryAction}
            {secondaryAction}
            {!primaryAction && !secondaryAction ? action : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
