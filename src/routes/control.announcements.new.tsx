import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import { upsertControlAnnouncement } from "@/lib/control/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/announcements/new")({
  component: AnnouncementNewPage,
});

function AnnouncementNewPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [locale, setLocale] = useState<"ar" | "en" | "both">("ar");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setBusy(true);
    const r = await upsertControlAnnouncement({
      data: { accessToken, title, body, locale, status },
    });
    setBusy(false);
    if (!r.ok) toast.error(r.error);
    else {
      toast.success(t("control.ann.saved"));
      void navigate({ to: "/control/announcements" });
    }
  };

  return (
    <form onSubmit={submit} className="max-w-xl space-y-3">
      <label className="block text-xs font-semibold text-stone-400">
        {t("control.ann.field.title")}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          dir="auto"
          required
          className="mt-1 w-full rounded-lg border border-border-subtle bg-white/5 px-3 py-2 text-sm text-white"
        />
      </label>
      <label className="block text-xs font-semibold text-stone-400">
        {t("control.ann.field.body")}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          dir="auto"
          required
          rows={6}
          className="mt-1 w-full rounded-lg border border-border-subtle bg-white/5 px-3 py-2 text-sm text-white"
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <label className="text-xs font-semibold text-stone-400">
          {t("control.ann.field.locale")}
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as "ar" | "en" | "both")}
            className="ms-2 rounded-lg border border-border-subtle bg-white/5 px-2 py-1 text-white"
          >
            <option value="ar">AR</option>
            <option value="en">EN</option>
            <option value="both">AR+EN</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-stone-400">
          {t("control.ann.field.status")}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "draft" | "published")}
            className="ms-2 rounded-lg border border-border-subtle bg-white/5 px-2 py-1 text-white"
          >
            <option value="draft">{t("control.ann.status.draft")}</option>
            <option value="published">{t("control.ann.status.published")}</option>
          </select>
        </label>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-accent/20 px-4 py-2 text-xs font-semibold text-accent disabled:opacity-50"
      >
        {t("control.ann.save")}
      </button>
    </form>
  );
}
