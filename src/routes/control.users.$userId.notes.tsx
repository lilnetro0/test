import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import { addControlUserNote, listEnforcementEvents, type AuditLogRow } from "@/lib/control/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/users/$userId/notes")({
  component: UserNotesPage,
});

function UserNotesPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const { userId } = Route.useParams();
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState<AuditLogRow[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!accessToken) return;
    const r = await listEnforcementEvents({
      data: { accessToken, targetUserId: userId, limit: 50 },
    });
    if (r.ok) setNotes(r.rows.filter((x) => x.action === "user.note"));
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, userId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken || !draft.trim()) return;
    setBusy(true);
    const res = await addControlUserNote({
      data: { accessToken, userId, note: draft },
    });
    setBusy(false);
    if (!res.ok) toast.error(res.error);
    else {
      toast.success(t("control.user.noteAdded"));
      setDraft("");
      void load();
    }
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => void submit(e)}
        className="space-y-2 rounded-xl border border-border-subtle p-4"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
          rows={3}
          dir="auto"
          placeholder={t("control.user.notePlaceholder")}
          className="w-full rounded-lg border border-border-subtle bg-white/5 px-3 py-2 text-sm text-white"
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          className="rounded-md bg-accent/20 px-3 py-1.5 text-xs font-semibold text-accent disabled:opacity-50"
        >
          {t("control.user.addNote")}
        </button>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-stone-500">{t("control.user.noNotes")}</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => {
            const meta = n.meta as { note?: string } | null;
            return (
              <li key={n.id} className="rounded-xl border border-border-subtle p-3">
                <p className="text-sm text-stone-200" dir="auto">
                  {meta?.note ?? "—"}
                </p>
                <p className="mt-1 text-[10px] text-stone-500">
                  {new Date(n.created_at).toLocaleString()}
                  {n.actor_username
                    ? ` · ${n.actor_username}#${n.actor_tag}`
                    : ` · ${n.actor_id.slice(0, 8)}`}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
