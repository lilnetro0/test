import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { REPORT_REASONS, type ReportReason } from "@/lib/trust-safety";
import { useT, type TKey } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-provider";

const REASON_LABEL_KEYS: Record<ReportReason, TKey> = {
  abuse: "report.reason.abuse",
  spam: "report.reason.spam",
  harassment: "report.reason.harassment",
  illegal: "report.reason.illegal",
  other: "report.reason.other",
};

export type ReportVoiceParticipant = {
  id: string;
  name: string;
};

export type ReportDialogTarget = {
  targetUserId?: string;
  messageId?: string;
  dmMessageId?: string;
  preview?: string;
  voiceChannelId?: string;
  voiceChannelName?: string;
  voiceParticipants?: ReportVoiceParticipant[];
};

/**
 * Report flow as a bottom sheet (Phase G) — replaces centered Dialog for consumer UX.
 * Export name kept as ReportDialog for call-site stability.
 */
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
    targetUserId?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
}) {
  const { t } = useT();
  const { user } = useAuth();
  const [reason, setReason] = useState<ReportReason>("abuse");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [pickedUserId, setPickedUserId] = useState("");

  const voiceOptions =
    target?.voiceParticipants?.filter((p) => p.id && p.id !== user?.id) ?? [];

  useEffect(() => {
    if (!open || !target) return;
    setPickedUserId(target.targetUserId ?? "");
  }, [open, target]);

  const reset = () => {
    setReason("abuse");
    setDetails("");
    setBusy(false);
    setPickedUserId("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="bottom-[var(--dock-clearance)] max-h-[min(85dvh,calc(100dvh-var(--dock-clearance)))] rounded-t-2xl border-border-subtle bg-surface-mid p-0 sm:mx-auto sm:max-w-md"
      >
        <SheetHeader className="space-y-2 border-b border-border-subtle px-4 py-4 text-start">
          <SheetTitle className="nx-title">{t("report.title")}</SheetTitle>
          <SheetDescription className="nx-body">{t("report.desc")}</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
          {target?.preview ? (
            <p
              className="line-clamp-3 rounded-lg border border-border-subtle bg-white/[0.03] p-3 text-xs text-stone-400"
              dir="auto"
            >
              {target.preview}
            </p>
          ) : null}

          {target?.voiceChannelId && voiceOptions.length > 0 ? (
            <label className="block space-y-1.5">
              <span className="nx-label">{t("report.voicePickLabel")}</span>
              <select
                value={pickedUserId}
                onChange={(e) => setPickedUserId(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-white outline-none focus:border-accent/50"
              >
                <option value="">{t("report.voicePickNone")}</option>
                {voiceOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <fieldset className="space-y-2">
            <legend className="nx-section">{t("report.reasonLabel")}</legend>
            <div className="grid gap-1.5">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 text-sm ${
                    reason === r
                      ? "border-accent/50 bg-accent/10 text-white"
                      : "border-border-subtle text-stone-300 hover:bg-white/5"
                  }`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    className="accent-[color:var(--accent)]"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                  />
                  {t(REASON_LABEL_KEYS[r])}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block space-y-1.5">
            <span className="nx-label">{t("report.detailsLabel")}</span>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, 500))}
              rows={3}
              placeholder={t("report.detailsPlaceholder")}
              dir="auto"
              className="w-full resize-none rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-white outline-none focus:border-accent/50"
            />
          </label>
        </div>

        <SheetFooter className="flex-col gap-2 border-t border-border-subtle px-4 py-3 sm:flex-col">
          <Button
            type="button"
            variant="accent"
            size="touch"
            className="w-full"
            disabled={busy || !target}
            onClick={async () => {
              if (!target) return;
              setBusy(true);
              const voiceStamp =
                target.voiceChannelId != null
                  ? `[voice:${target.voiceChannelId}|${target.voiceChannelName ?? ""}]\n`
                  : "";
              const chosen = pickedUserId || target.targetUserId || undefined;
              const res = await onSubmit({
                reason,
                details: `${voiceStamp}${details.trim()}`.trim(),
                targetUserId: chosen,
              });
              setBusy(false);
              if (res.ok) handleOpenChange(false);
            }}
          >
            {busy ? t("report.submitting") : t("report.submit")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="touch"
            className="w-full"
            disabled={busy}
            onClick={() => handleOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
