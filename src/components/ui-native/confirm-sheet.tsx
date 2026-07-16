import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Confirm / destructive action sheet shell. Wire concrete flows in later phases.
 */
export function ConfirmSheet({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  destructive,
  busy,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  onConfirm: () => void | Promise<void>;
  destructive?: boolean;
  busy?: boolean;
  className?: string;
}) {
  const { t } = useT();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          "bottom-[var(--dock-clearance)] rounded-t-2xl border-border-subtle bg-surface-mid p-0 sm:max-w-md sm:mx-auto",
          className,
        )}
      >
        <SheetHeader className="space-y-2 px-4 py-4 text-start">
          <SheetTitle className="nx-title">{title}</SheetTitle>
          {description ? <SheetDescription className="nx-body">{description}</SheetDescription> : null}
        </SheetHeader>
        <SheetFooter className="flex-col gap-2 border-t border-border-subtle px-4 py-3 sm:flex-col">
          <Button
            type="button"
            variant={destructive ? "destructive" : "accent"}
            size="touch"
            disabled={busy}
            className="w-full"
            onClick={() => void onConfirm()}
          >
            {confirmLabel ?? t("common.confirm")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="touch"
            disabled={busy}
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel ?? t("common.cancel")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
