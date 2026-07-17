import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import { adminListGames, adminUpsertHub } from "@/lib/admin/api";
import { REGION_OPTIONS, normalizeRegionCode, type RegionCode } from "@/lib/regions";
import { useT } from "@/lib/i18n";

type NewCommunitySearch = { game_id?: string };

export const Route = createFileRoute("/control/communities/new")({
  validateSearch: (s: Record<string, unknown>): NewCommunitySearch => ({
    game_id: typeof s.game_id === "string" && s.game_id ? s.game_id : undefined,
  }),
  component: CommunityNewPage,
});

function CommunityNewPage() {
  const { t, lang } = useT();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const { game_id: preselectGameId } = Route.useSearch();
  const [games, setGames] = useState<Array<{ id: string; name: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [applyTemplate, setApplyTemplate] = useState(true);
  const [form, setForm] = useState({
    game_id: preselectGameId ?? "",
    name: "",
    slug: "",
    image_url: "",
    region: "" as RegionCode,
  });

  useEffect(() => {
    if (!accessToken) return;
    void adminListGames({ data: { accessToken } }).then((r) => {
      if (!r.ok) return;
      const list = (r.games ?? []).map((g: { id: string; name: string }) => ({
        id: g.id,
        name: g.name,
      }));
      setGames(list);
      setForm((f) => {
        if (f.game_id) return f;
        if (preselectGameId && list.some((g) => g.id === preselectGameId)) {
          return { ...f, game_id: preselectGameId };
        }
        return list[0] ? { ...f, game_id: list[0].id } : f;
      });
    });
  }, [accessToken, preselectGameId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setBusy(true);
    const r = await adminUpsertHub({
      data: {
        accessToken,
        hub: {
          game_id: form.game_id,
          name: form.name,
          slug: form.slug || undefined,
          image_url: form.image_url || null,
          region: form.region || null,
        },
        applyMenaChannelTemplate: applyTemplate,
      },
    });
    setBusy(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    toast.success(t("control.comm.created"));
    if ("channelsSeeded" in r && r.channelsSeeded) {
      toast.message(t("control.comm.seeded", { n: String(r.channelsSeeded) }));
    }
    if ("hubId" in r && typeof r.hubId === "string") {
      void navigate({
        to: "/control/communities/$communityId",
        params: { communityId: r.hubId },
      });
    } else {
      void navigate({ to: "/control/communities" });
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 p-4 md:p-8">
      <Link to="/control/communities" className="text-xs font-semibold text-accent">
        ← {t("control.comm.back")}
      </Link>
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <Building2 className="size-5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            {t("control.nav.communities")}
          </p>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{t("control.comm.create")}</h1>
      </header>

      <form onSubmit={(e) => void submit(e)} className="space-y-3 rounded-xl border border-border-subtle p-4">
        <Field label={t("control.comm.field.name")}>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inputCls}
            dir="auto"
          />
        </Field>
        <Field label={t("control.comm.field.slug")}>
          <input
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            placeholder={t("control.comm.slugHint")}
            className={inputCls}
          />
        </Field>
        <Field label={t("control.comm.field.game")}>
          <select
            required
            value={form.game_id}
            onChange={(e) => setForm((f) => ({ ...f, game_id: e.target.value }))}
            className={inputCls}
          >
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("control.comm.field.region")}>
          <select
            value={form.region}
            onChange={(e) =>
              setForm((f) => ({ ...f, region: normalizeRegionCode(e.target.value) }))
            }
            className={inputCls}
          >
            <option value="">{t("control.comm.regionGlobal")}</option>
            {REGION_OPTIONS.map((o) => (
              <option key={o.code} value={o.code}>
                {lang === "ar" ? o.ar : o.en}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("control.comm.field.image")}>
          <input
            value={form.image_url}
            onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
            className={inputCls}
          />
        </Field>
        <label className="flex items-center gap-2 text-xs text-stone-300">
          <input
            type="checkbox"
            checked={applyTemplate}
            onChange={(e) => setApplyTemplate(e.target.checked)}
          />
          {t("control.comm.seedTemplate")}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1 text-xs text-stone-400">
      <span>{label}</span>
      {children}
    </label>
  );
}
