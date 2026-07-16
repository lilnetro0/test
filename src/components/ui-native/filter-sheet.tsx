import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Bottom filter sheet shell. Wire filter controls in Phase D+.
 * Clears above the app dock via --dock-clearance.
 */
export function FilterSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          "bottom-[var(--dock-clearance)] max-h-[min(75dvh,calc(100dvh-var(--dock-clearance)))] rounded-t-2xl border-border-subtle bg-surface-mid p-0",
          className,
        )}
      >
        <SheetHeader className="border-b border-border-subtle px-4 py-3 text-start">
          <SheetTitle className="nx-title">{title}</SheetTitle>
          {description ? <SheetDescription className="nx-body">{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
        {footer ? (
          <SheetFooter className="border-t border-border-subtle px-4 py-3 sm:space-x-0">{footer}</SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
