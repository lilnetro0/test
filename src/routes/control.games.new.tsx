import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Gamepad2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import { adminUpsertGame } from "@/lib/admin/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/games/new")({
  component: GameNewPage,
});

const CATEGORIES = ["shooter", "moba", "sandbox", "battle-royale", "sports"] as const;

function GameNewPage() {
  const { t } = useT();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    id: "",
    name: "",
    short: "",
    category: "sandbox",
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setBusy(true);
    const r = await adminUpsertGame({
      data: {
        accessToken,
        game: {
          id: form.id,
          name: form.name,
          short: form.short,
          category: form.category,
        },
      },
    });
    setBusy(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    toast.success(t("control.games.created"));
    const id = form.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    void navigate({ to: "/control/games/$gameId", params: { gameId: id } });
  };

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 p-4 md:p-8">
      <Link to="/control/games" className="text-xs font-semibold text-accent">
        ← {t("control.games.back")}
      </Link>
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <Gamepad2 className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.catalog")}
          </p>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{t("control.games.create")}</h1>
      </header>

      <form onSubmit={(e) => void submit(e)} className="space-y-3 rounded-xl border border-border-subtle p-4">
        <label className="block space-y-1 text-xs text-stone-400">
          {t("control.games.field.id")}
          <input
            required
            value={form.id}
            onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
            className={inputCls}
          />
        </label>
        <label className="block space-y-1 text-xs text-stone-400">
          {t("control.games.field.name")}
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inputCls}
            dir="auto"
          />
        </label>
        <label className="block space-y-1 text-xs text-stone-400">
          {t("control.games.field.short")}
          <input
            value={form.short}
            onChange={(e) => setForm((f) => ({ ...f, short: e.target.value }))}
            className={inputCls}
          />
        </label>
        <label className="block space-y-1 text-xs text-stone-400">
          {t("control.games.field.category")}
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className={inputCls}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-accent/20 px-4 py-2 text-xs font-semibold text-accent disabled:opacity-50"
        >
          {t("control.comm.save")}
        </button>
      </form>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-border-subtle bg-white/5 px-3 py-2 text-sm text-white";
