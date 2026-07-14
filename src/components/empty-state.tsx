import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Shared empty surface for zero-friends / zero-DMs / zero-alerts, etc.
 * Intentionally not a "card" — soft surface, one purpose, one CTA slot.
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid min-h-[320px] place-items-center px-6 text-center">
      <div className="max-w-sm">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-border-subtle bg-white/[0.03] text-accent">
          <Icon className="size-6" />
        </div>
        <h3 className="mt-4 font-display text-sm font-bold uppercase tracking-tight text-white">
          {title}
        </h3>
        <p className="mt-2 text-sm text-stone-400">{body}</p>
        {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}
