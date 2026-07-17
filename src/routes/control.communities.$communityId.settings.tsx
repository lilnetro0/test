import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import { adminUploadHubMedia, adminUpsertHub } from "@/lib/admin/api";
import { getControlHub, type ControlHubDetail } from "@/lib/control/api";
import { fileToBase64 } from "@/lib/control/media";
import { REGION_OPTIONS, normalizeRegionCode, type RegionCode } from "@/lib/regions";
import { HUB_MEDIA_ACCEPT } from "@/lib/supabase/storage-policy";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/control/communities/$communityId/settings")({
  component: CommunitySettingsPage,
});

function CommunitySettingsPage() {
  const { t, lang } = useT();
  const { accessToken } = useAuth();
  const { communityId } = Route.useParams();
  const [hub, setHub] = useState<ControlHubDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    image_url: "",
    region: "" as RegionCode,
  });

  useEffect(() => {
    if (!accessToken) return;
    void getControlHub({ data: { accessToken, hubId: communityId } }).then((r) => {
      if (!r.ok) return;
      setHub(r.hub);
      setForm({
        name: r.hub.name,
        slug: r.hub.slug,
        image_url: r.hub.image_url ?? "",
        region: (r.hub.region as RegionCode) || "",
      });
    });
  }, [accessToken, communityId]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken || !hub) return;
    setBusy(true);
    const r = await adminUpsertHub({
      data: {
        accessToken,
        hub: {
          id: hub.id,
          game_id: hub.game_id,
          name: form.name,
          slug: form.slug,
          image_url: form.image_url || null,
          region: form.region || null,
        },
      },
    });
    setBusy(false);
    if (!r.ok) toast.error(r.error);
    else toast.success(t("control.comm.saved"));
  };

  const upload = async (file: File | null) => {
    if (!file || !accessToken || !hub) return;
    setBusy(true);
    const { base64, contentType } = await fileToBase64(file);
    const r = await adminUploadHubMedia({
      data: {
        accessToken,
        base64,
        contentType,
        attachTo: { kind: "hub", id: hub.id },
      },
    });
    setBusy(false);
    if (!r.ok) toast.error(r.error);
    else {
      setForm((f) => ({ ...f, image_url: r.url }));
      toast.success(t("control.comm.imageUpdated"));
    }
  };

  if (!hub) return <p className="text-sm text-stone-500">{t("control.checking")}</p>;

  return (
    <form onSubmit={(e) => void save(e)} className="space-y-3 rounded-xl border border-border-subtle p-4">
      <label className="block space-y-1 text-xs text-stone-400">
        {t("control.comm.field.name")}
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className={inputCls}
          dir="auto"
        />
      </label>
      <label className="block space-y-1 text-xs text-stone-400">
        {t("control.comm.field.slug")}
        <input
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          className={inputCls}
        />
      </label>
      <label className="block space-y-1 text-xs text-stone-400">
        {t("control.comm.field.region")}
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
      </label>
      <label className="block space-y-1 text-xs text-stone-400">
        {t("control.comm.field.image")}
        <input
          value={form.image_url}
          onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
          className={inputCls}
        />
      </label>
      <label className="block space-y-1 text-xs text-stone-400">
        {t("control.comm.uploadImage")}
        <input
          type="file"
          accept={HUB_MEDIA_ACCEPT}
          onChange={(e) => void upload(e.target.files?.[0] ?? null)}
          className="block text-sm text-stone-300"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-accent/20 px-4 py-2 text-xs font-semibold text-accent disabled:opacity-50"
      >
        {t("control.comm.save")}
      </button>
    </form>
  );
}

const inputCls =
  "w-full rounded-lg border border-border-subtle bg-white/5 px-3 py-2 text-sm text-white";
