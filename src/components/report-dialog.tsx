import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { REPORT_REASONS, type ReportReason } from "@/lib/trust-safety";
import { useT, type TKey } from "@/lib/i18n";

const REASON_LABEL_KEYS: Record<ReportReason, TKey> = {
  abuse: "report.reason.abuse",
  spam: "report.reason.spam",
  harassment: "report.reason.harassment",
  illegal: "report.reason.illegal",
  other: "report.reason.other",
};

export type ReportDialogTarget = {
  targetUserId?: string;
  messageId?: string;
  dmMessageId?: string;
  preview?: string;
};

export function ReportDialog({
  open,
  onOpenChange,
  target,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: ReportDialogTarget | null;
  onSubmit: (input: {
    reason: ReportReason;
    details: string;
  }) => Promise<{ ok: boolean; error?: string }>;
}) {
  const { t } = useT();
  const [reason, setReason] = useState<ReportReason>("abuse");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setReason("abuse");
    setDetails("");
    setBusy(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-border-subtle bg-surface-mid sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-base font-bold uppercase tracking-tight text-white">
            {t("report.title")}
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-400">
            {t("report.desc")}
          </DialogDescription>
        </DialogHeader>

        {target?.preview ? (
          <p className="line-clamp-3 rounded-md border border-border-subtle bg-background/50 p-2 text-xs text-stone-400">
            {target.preview}
          </p>
        ) : null}

        <fieldset className="space-y-2">
          <legend className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
            {t("report.reasonLabel")}
          </legend>
          <div className="grid gap-1.5">
            {REPORT_REASONS.map((r) => (
              <label
                key={r}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs ${
                  reason === r
                    ? "border-accent/50 bg-accent/10 text-white"
                    : "border-border-subtle text-stone-300 hover:bg-white/5"
                }`}
              >
                <input
                  type="radio"
                  name="report-reason"
                  className="accent-[hsl(var(--accent))]"
                  checked={reason === r}
                  onChange={() => setReason(r)}
                />
                {t(REASON_LABEL_KEYS[r])}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
            {t("report.detailsLabel")}
          </span>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value.slice(0, 500))}
            rows={3}
            placeholder={t("report.detailsPlaceholder")}
            className="w-full resize-none rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-white outline-none focus:border-accent/50"
          />
        </label>

        <DialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            className="rounded-md px-3 py-2 text-xs font-semibold text-stone-400 hover:text-white"
            onClick={() => handleOpenChange(false)}
            disabled={busy}
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            disabled={busy || !target}
            className="rounded-md bg-accent px-3 py-2 text-xs font-bold uppercase tracking-wide text-accent-foreground hover:brightness-110 disabled:opacity-50"
            onClick={async () => {
              if (!target) return;
              setBusy(true);
              const res = await onSubmit({ reason, details: details.trim() });
              setBusy(false);
              if (res.ok) handleOpenChange(false);
            }}
          >
            {busy ? t("report.submitting") : t("report.submit")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
