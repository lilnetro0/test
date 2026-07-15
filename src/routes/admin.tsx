import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";
import {
  adminBanUser,
  adminDeleteGame,
  adminDeleteHub,
  adminDeleteTextChannel,
  adminDeleteVoiceChannel,
  adminGrantPlatformRole,
  adminListBanned,
  adminListChannels,
  adminListGames,
  adminListHubs,
  adminListPlatformAdmins,
  adminListReports,
  adminLookupUser,
  adminRevokePlatformRole,
  adminSetReportStatus,
  adminUploadHubMedia,
  adminUpsertGame,
  adminUpsertHub,
  adminUpsertTextChannel,
  adminUpsertVoiceChannel,
  checkIsAdmin,
} from "@/lib/admin/api";
import { Gamepad2, Hash, Mic, Shield, Flag, Users, Database } from "lucide-react";
import { getAppHealth } from "@/lib/ops/get-app-health";
import type { AppHealthReport } from "@/lib/ops/health";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Nexus" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Tab = "hubs" | "games" | "channels" | "users" | "reports";

type GameRow = {
  id: string;
  name: string;
  short: string;
  category: string;
  tint: string;
  text_tint: string;
  image_url: string | null;
};

type HubRow = {
  id: string;
  game_id: string;
  slug: string;
  name: string;
  member_count: number;
  active_count: string;
  image_url: string | null;
};

function AdminPage() {
  const { user, accessToken, loading } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("hubs");
  const [health, setHealth] = useState<AppHealthReport | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user || !accessToken) {
      setAllowed(false);
      return;
    }
    void checkIsAdmin({ data: { accessToken } }).then((r) => setAllowed(r.admin));
  }, [user, accessToken, loading]);

  useEffect(() => {
    if (allowed !== true) return;
    void getAppHealth().then(setHealth).catch(() => setHealth(null));
  }, [allowed]);

  if (allowed === false) {
    return (
      <AppShell>
        <main className="grid flex-1 place-items-center p-8 text-sm text-stone-500">
          Admin access required. Use platform_roles or ADMIN_USER_IDS (see docs/ADMIN-SECURITY.md).
        </main>
      </AppShell>
    );
  }

  if (allowed === null || !accessToken) {
    return (
      <AppShell>
        <main className="grid flex-1 place-items-center p-8 text-sm text-stone-500">Checking…</main>
      </AppShell>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Shield }[] = [
    { id: "hubs", label: "Hubs", icon: Gamepad2 },
    { id: "games", label: "Games", icon: Gamepad2 },
    { id: "channels", label: "Channels", icon: Hash },
    { id: "users", label: "Users", icon: Users },
    { id: "reports", label: "Reports", icon: Flag },
  ];

  return (
    <AppShell>
      <main className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border-subtle px-4 md:px-6">
          <Shield className="size-5 text-accent" />
          <h1 className="font-display text-base font-bold uppercase tracking-tight text-white">
            Admin console
          </h1>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
            <span className="inline-flex items-center gap-1">
              <Database className="size-3.5" />
              {health == null
                ? "…"
                : health.supabase.ok
                  ? `DB · ${health.supabase.games ?? 0} games`
                  : "DB · down"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Mic className="size-3.5" />
              {health == null
                ? "…"
                : !health.livekit.configured
                  ? "LiveKit · stub"
                  : health.livekit.reachable === false
                    ? `LiveKit · unreachable`
                    : `LiveKit · ${health.livekit.urlHost ?? "ok"}`}
            </span>
          </div>
        </header>
        <div className="flex gap-1 overflow-x-auto border-b border-border-subtle px-3 py-2 no-scrollbar">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  tab === t.id
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border-subtle text-stone-400"
                }`}
              >
                <Icon className="size-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          {tab === "hubs" && <HubsTab accessToken={accessToken} />}
          {tab === "games" && <GamesTab accessToken={accessToken} />}
          {tab === "channels" && <ChannelsTab accessToken={accessToken} />}
          {tab === "users" && <UsersTab accessToken={accessToken} selfUserId={user!.id} />}
          {tab === "reports" && <ReportsTab accessToken={accessToken} />}
        </div>
      </main>
    </AppShell>
  );
}

async function fileToBase64(file: File): Promise<{ base64: string; contentType: string }> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return { base64: btoa(binary), contentType: file.type || "image/jpeg" };
}

function HubsTab({ accessToken }: { accessToken: string }) {
  const [hubs, setHubs] = useState<HubRow[]>([]);
  const [games, setGames] = useState<GameRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    id: "",
    game_id: "",
    name: "",
    slug: "",
    image_url: "",
  });

  const refresh = useCallback(async () => {
    const [h, g] = await Promise.all([
      adminListHubs({ data: { accessToken } }),
      adminListGames({ data: { accessToken } }),
    ]);
    if (h.ok) setHubs(h.hubs as HubRow[]);
    else toast.error(h.error);
    if (g.ok) {
      setGames(g.games as GameRow[]);
      if (!form.game_id && g.games?.[0]) {
        setForm((f) => ({ ...f, game_id: (g.games as GameRow[])[0]!.id }));
      }
    }
  }, [accessToken, form.game_id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = async () => {
    setBusy(true);
    const result = await adminUpsertHub({
      data: {
        accessToken,
        hub: {
          id: form.id || undefined,
          game_id: form.game_id,
          name: form.name,
          slug: form.slug || undefined,
          image_url: form.image_url || null,
        },
      },
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(form.id ? "Hub updated" : "Hub created");
    if ("slugDiffersFromGame" in result && result.slugDiffersFromGame) {
      toast.message("Slug differs from game id — URLs use the hub slug; hero art uses the game id.");
    }
    setForm({ id: "", game_id: games[0]?.id ?? "", name: "", slug: "", image_url: "" });
    void refresh();
  };

  const upload = async (file: File | null, hubId?: string) => {
    if (!file) return;
    setBusy(true);
    const { base64, contentType } = await fileToBase64(file);
    const result = await adminUploadHubMedia({
      data: {
        accessToken,
        base64,
        contentType,
        attachTo: hubId ? { kind: "hub", id: hubId } : undefined,
      },
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    if (hubId) {
      toast.success("Hub image updated");
      void refresh();
    } else {
      setForm((f) => ({ ...f, image_url: result.url }));
      toast.success("Image uploaded — save hub to attach");
    }
  };

  return (
    <div className="space-y-6">
      <Panel title={form.id ? "Edit hub" : "Create hub"}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="Slug (optional)">
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className={inputCls}
              placeholder="defaults to game id"
            />
          </Field>
          <Field label="Game">
            <select
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
          <Field label="Image URL">
            <input
              value={form.image_url}
              onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="cursor-pointer rounded-lg border border-border-subtle px-3 py-2 text-xs font-semibold text-stone-300">
            Upload image
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => void upload(e.target.files?.[0] ?? null, form.id || undefined)}
            />
          </label>
          <button
            type="button"
            disabled={busy || !form.name || !form.game_id}
            onClick={() => void save()}
            className="rounded-lg bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent-foreground disabled:opacity-40"
          >
            {form.id ? "Save" : "Create"}
          </button>
          {form.id ? (
            <button
              type="button"
              onClick={() =>
                setForm({ id: "", game_id: games[0]?.id ?? "", name: "", slug: "", image_url: "" })
              }
              className="rounded-lg border border-border-subtle px-3 py-2 text-xs text-stone-400"
            >
              Cancel edit
            </button>
          ) : null}
        </div>
      </Panel>

      <Panel title={`Hubs (${hubs.length})`}>
        <ul className="divide-y divide-border-subtle">
          {hubs.map((h) => (
            <li key={h.id} className="flex flex-wrap items-center gap-3 py-3">
              {h.image_url ? (
                <img src={h.image_url} alt="" className="size-10 rounded-lg object-cover" />
              ) : (
                <div className="grid size-10 place-items-center rounded-lg bg-stone-800 text-[10px] text-stone-500">
                  —
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{h.name}</p>
                <p className="truncate text-[11px] text-stone-500">
                  {h.slug} · {h.game_id}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    id: h.id,
                    game_id: h.game_id,
                    name: h.name,
                    slug: h.slug,
                    image_url: h.image_url ?? "",
                  })
                }
                className="text-xs font-semibold text-accent"
              >
                Edit
              </button>
              <label className="cursor-pointer text-xs font-semibold text-stone-400">
                Pic
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => void upload(e.target.files?.[0] ?? null, h.id)}
                />
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  if (!confirm(`Delete hub ${h.name}?`)) return;
                  setBusy(true);
                  const r = await adminDeleteHub({ data: { accessToken, hubId: h.id } });
                  setBusy(false);
                  if (!r.ok) toast.error(r.error);
                  else {
                    toast.success("Hub deleted");
                    void refresh();
                  }
                }}
                className="text-xs font-semibold text-danger"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function GamesTab({ accessToken }: { accessToken: string }) {
  const [games, setGames] = useState<GameRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    id: "",
    name: "",
    short: "",
    category: "sandbox",
    tint: "bg-stone-500/20",
    text_tint: "text-stone-300",
    image_url: "",
  });

  const refresh = useCallback(async () => {
    const g = await adminListGames({ data: { accessToken } });
    if (g.ok) setGames(g.games as GameRow[]);
    else toast.error(g.error);
  }, [accessToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = async () => {
    setBusy(true);
    const result = await adminUpsertGame({
      data: {
        accessToken,
        game: {
          id: form.id,
          name: form.name,
          short: form.short,
          category: form.category,
          tint: form.tint,
          text_tint: form.text_tint,
          image_url: form.image_url || null,
        },
      },
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Game saved");
    void refresh();
  };

  return (
    <div className="space-y-6">
      <Panel title="Create / update game">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Id (slug)">
            <input
              value={form.id}
              onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
              className={inputCls}
              placeholder="valorant"
            />
          </Field>
          <Field label="Name">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="Short">
            <input
              value={form.short}
              onChange={(e) => setForm((f) => ({ ...f, short: e.target.value }))}
              className={inputCls}
              placeholder="VAL"
            />
          </Field>
          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className={inputCls}
            >
              {["shooter", "moba", "sandbox", "battle-royale", "sports"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Image URL">
            <input
              value={form.image_url}
              onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="cursor-pointer rounded-lg border border-border-subtle px-3 py-2 text-xs font-semibold text-stone-300">
            Upload image
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !form.id) {
                  toast.error("Set game id first");
                  return;
                }
                setBusy(true);
                const { base64, contentType } = await fileToBase64(file);
                const r = await adminUploadHubMedia({
                  data: {
                    accessToken,
                    base64,
                    contentType,
                    attachTo: { kind: "game", id: form.id },
                  },
                });
                setBusy(false);
                if (!r.ok) toast.error(r.error);
                else {
                  setForm((f) => ({ ...f, image_url: r.url }));
                  toast.success("Image set");
                  void refresh();
                }
              }}
            />
          </label>
          <button
            type="button"
            disabled={busy || !form.id || !form.name}
            onClick={() => void save()}
            className="rounded-lg bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent-foreground disabled:opacity-40"
          >
            Save game
          </button>
        </div>
      </Panel>

      <Panel title={`Games (${games.length})`}>
        <ul className="divide-y divide-border-subtle">
          {games.map((g) => (
            <li key={g.id} className="flex flex-wrap items-center gap-3 py-3">
              {g.image_url ? (
                <img src={g.image_url} alt="" className="size-10 rounded-lg object-cover" />
              ) : (
                <div className={`grid size-10 place-items-center rounded-lg text-[10px] font-bold ${g.tint} ${g.text_tint}`}>
                  {g.short}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white">{g.name}</p>
                <p className="text-[11px] text-stone-500">
                  {g.id} · {g.category}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    id: g.id,
                    name: g.name,
                    short: g.short,
                    category: g.category,
                    tint: g.tint,
                    text_tint: g.text_tint,
                    image_url: g.image_url ?? "",
                  })
                }
                className="text-xs font-semibold text-accent"
              >
                Edit
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  if (!confirm(`Delete game ${g.id}? Cascades hubs.`)) return;
                  setBusy(true);
                  const r = await adminDeleteGame({ data: { accessToken, gameId: g.id } });
                  setBusy(false);
                  if (!r.ok) toast.error(r.error);
                  else {
                    toast.success("Game deleted");
                    void refresh();
                  }
                }}
                className="text-xs font-semibold text-danger"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function ChannelsTab({ accessToken }: { accessToken: string }) {
  const [hubs, setHubs] = useState<HubRow[]>([]);
  const [hubId, setHubId] = useState("");
  const [text, setText] = useState<
    Array<{ id: string; name: string; slug: string; topic: string | null; position: number }>
  >([]);
  const [voice, setVoice] = useState<
    Array<{ id: string; name: string; slug: string; position: number }>
  >([]);
  const [busy, setBusy] = useState(false);
  const [textName, setTextName] = useState("");
  const [voiceName, setVoiceName] = useState("");
  const [topic, setTopic] = useState("");

  const refreshHubs = useCallback(async () => {
    const h = await adminListHubs({ data: { accessToken } });
    if (h.ok) {
      const list = h.hubs as HubRow[];
      setHubs(list);
      if (!hubId && list[0]) setHubId(list[0].id);
    }
  }, [accessToken, hubId]);

  const refreshChannels = useCallback(async () => {
    if (!hubId) return;
    const c = await adminListChannels({ data: { accessToken, hubId } });
    if (!c.ok) {
      toast.error(c.error);
      return;
    }
    setText(c.text);
    setVoice(c.voice);
  }, [accessToken, hubId]);

  useEffect(() => {
    void refreshHubs();
  }, [refreshHubs]);

  useEffect(() => {
    void refreshChannels();
  }, [refreshChannels]);

  return (
    <div className="space-y-6">
      <Field label="Hub">
        <select value={hubId} onChange={(e) => setHubId(e.target.value)} className={inputCls}>
          {hubs.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </Field>

      <Panel title="Text channels">
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            value={textName}
            onChange={(e) => setTextName(e.target.value)}
            placeholder="Channel name"
            className={`${inputCls} max-w-xs`}
          />
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic (optional)"
            className={`${inputCls} max-w-xs`}
          />
          <button
            type="button"
            disabled={busy || !hubId || !textName.trim()}
            onClick={async () => {
              setBusy(true);
              const r = await adminUpsertTextChannel({
                data: {
                  accessToken,
                  channel: { hub_id: hubId, name: textName, topic: topic || null },
                },
              });
              setBusy(false);
              if (!r.ok) toast.error(r.error);
              else {
                toast.success("Text channel created");
                setTextName("");
                setTopic("");
                void refreshChannels();
              }
            }}
            className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-2 text-xs font-bold uppercase text-accent-foreground disabled:opacity-40"
          >
            <Hash className="size-3.5" /> Add text
          </button>
        </div>
        <ul className="divide-y divide-border-subtle">
          {text.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-2 text-sm">
              <Hash className="size-3.5 text-stone-500" />
              <span className="flex-1 text-white">{c.name}</span>
              <span className="text-[11px] text-stone-500">{c.slug}</span>
              <button
                type="button"
                className="text-xs text-danger"
                onClick={async () => {
                  if (!confirm(`Delete #${c.name}?`)) return;
                  const r = await adminDeleteTextChannel({
                    data: { accessToken, channelId: c.id },
                  });
                  if (!r.ok) toast.error(r.error);
                  else void refreshChannels();
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Voice channels">
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            placeholder="Voice name"
            className={`${inputCls} max-w-xs`}
          />
          <button
            type="button"
            disabled={busy || !hubId || !voiceName.trim()}
            onClick={async () => {
              setBusy(true);
              const r = await adminUpsertVoiceChannel({
                data: {
                  accessToken,
                  channel: { hub_id: hubId, name: voiceName },
                },
              });
              setBusy(false);
              if (!r.ok) toast.error(r.error);
              else {
                toast.success("Voice channel created");
                setVoiceName("");
                void refreshChannels();
              }
            }}
            className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-2 text-xs font-bold uppercase text-accent-foreground disabled:opacity-40"
          >
            <Mic className="size-3.5" /> Add voice
          </button>
        </div>
        <ul className="divide-y divide-border-subtle">
          {voice.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-2 text-sm">
              <Mic className="size-3.5 text-stone-500" />
              <span className="flex-1 text-white">{c.name}</span>
              <button
                type="button"
                className="text-xs text-danger"
                onClick={async () => {
                  if (!confirm(`Delete voice ${c.name}?`)) return;
                  const r = await adminDeleteVoiceChannel({
                    data: { accessToken, channelId: c.id },
                  });
                  if (!r.ok) toast.error(r.error);
                  else void refreshChannels();
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function UsersTab({ accessToken, selfUserId }: { accessToken: string; selfUserId: string }) {
  const [query, setQuery] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState<{
    id: string;
    username: string;
    tag: string;
    banned_at: string | null;
    ban_reason: string | null;
  } | null>(null);
  const [banned, setBanned] = useState<
    Array<{
      id: string;
      username: string;
      tag: string;
      banned_at: string | null;
      ban_reason: string | null;
    }>
  >([]);
  const [platformAdmins, setPlatformAdmins] = useState<
    Array<{
      user_id: string;
      username: string;
      tag: string;
      created_at: string;
    }>
  >([]);

  const loadBanned = useCallback(async () => {
    const r = await adminListBanned({ data: { accessToken } });
    if (r.ok) setBanned(r.profiles);
  }, [accessToken]);

  const loadAdmins = useCallback(async () => {
    const r = await adminListPlatformAdmins({ data: { accessToken } });
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    setPlatformAdmins(r.admins);
  }, [accessToken]);

  useEffect(() => {
    void loadBanned();
    void loadAdmins();
  }, [loadBanned, loadAdmins]);

  const lookup = async () => {
    setBusy(true);
    const result = await adminLookupUser({ data: { accessToken, usernameTag: query } });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setFound(result.profile);
    if (!result.profile) toast.error("Player not found");
  };

  const setBan = async (ban: boolean, userId?: string) => {
    const id = userId ?? found?.id;
    if (!id) return;
    setBusy(true);
    const result = await adminBanUser({
      data: {
        accessToken,
        targetUserId: id,
        ban,
        reason: reason.trim() || undefined,
      },
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(ban ? "User banned" : "User unbanned");
    void loadBanned();
    if (found?.id === id) void lookup();
  };

  const grantAdmin = async (userId?: string) => {
    const id = userId ?? found?.id;
    if (!id) return;
    setBusy(true);
    const result = await adminGrantPlatformRole({ data: { accessToken, targetUserId: id } });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Platform admin granted");
    void loadAdmins();
  };

  const revokeAdmin = async (userId: string) => {
    setBusy(true);
    const result = await adminRevokePlatformRole({ data: { accessToken, targetUserId: userId } });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Platform admin revoked");
    void loadAdmins();
  };

  const foundIsAdmin = found ? platformAdmins.some((a) => a.user_id === found.id) : false;

  return (
    <div className="space-y-6">
      <Panel title="Platform admins">
        <p className="mb-3 text-xs text-stone-500">
          Durable access via <span className="font-mono text-stone-400">platform_roles</span>. Env{" "}
          <span className="font-mono text-stone-400">ADMIN_USER_IDS</span> is bootstrap only.
        </p>
        {platformAdmins.length === 0 ? (
          <p className="text-xs text-stone-500">No rows yet — open this console with env UUID to bootstrap.</p>
        ) : (
          <ul className="space-y-2">
            {platformAdmins.map((a) => (
              <li
                key={a.user_id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-background/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {a.username}
                    <span className="ms-1 font-mono text-xs text-stone-500">#{a.tag}</span>
                    {a.user_id === selfUserId ? (
                      <span className="ms-2 text-[10px] uppercase tracking-wide text-accent">you</span>
                    ) : null}
                  </p>
                  <p className="truncate font-mono text-[10px] text-stone-600">{a.user_id}</p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void revokeAdmin(a.user_id)}
                  className="shrink-0 rounded-md border border-border-subtle px-2 py-1 text-[10px] font-semibold uppercase text-stone-300 hover:border-danger/40 hover:text-danger disabled:opacity-40"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Look up user">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Username#1234"
            className={`${inputCls} flex-1`}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void lookup()}
            className="rounded-lg bg-accent px-4 py-2 text-xs font-bold uppercase text-accent-foreground"
          >
            Look up
          </button>
        </div>
        {found && (
          <div className="mt-4 space-y-3 rounded-lg border border-border-subtle bg-background/50 p-4">
            <p className="text-sm font-bold text-white">
              {found.username}
              <span className="ms-1 font-mono text-xs text-stone-500">#{found.tag}</span>
            </p>
            <p className="text-xs text-stone-400">
              {found.banned_at
                ? `Banned${found.ban_reason ? `: ${found.ban_reason}` : ""}`
                : "Not banned"}
              {foundIsAdmin ? " · Platform admin" : ""}
            </p>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ban reason"
              className={inputCls}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || Boolean(found.banned_at)}
                onClick={() => void setBan(true)}
                className="rounded-lg bg-danger/90 px-4 py-2 text-xs font-bold uppercase text-white disabled:opacity-40"
              >
                Ban
              </button>
              <button
                type="button"
                disabled={busy || !found.banned_at}
                onClick={() => void setBan(false)}
                className="rounded-lg border border-border-subtle px-4 py-2 text-xs font-semibold text-stone-200 disabled:opacity-40"
              >
                Unban
              </button>
              <button
                type="button"
                disabled={busy || foundIsAdmin || Boolean(found.banned_at)}
                onClick={() => void grantAdmin()}
                className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-bold uppercase text-accent disabled:opacity-40"
              >
                Grant platform admin
              </button>
              {foundIsAdmin ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void revokeAdmin(found.id)}
                  className="rounded-lg border border-border-subtle px-4 py-2 text-xs font-semibold text-stone-200 disabled:opacity-40"
                >
                  Revoke platform admin
                </button>
              ) : null}
            </div>
          </div>
        )}
      </Panel>

      <Panel title={`Banned (${banned.length})`}>
        <ul className="divide-y divide-border-subtle">
          {banned.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="flex-1 text-white">
                {p.username}
                <span className="ms-1 font-mono text-xs text-stone-500">#{p.tag}</span>
              </span>
              <span className="max-w-[40%] truncate text-[11px] text-stone-500">
                {p.ban_reason}
              </span>
              <button
                type="button"
                className="text-xs font-semibold text-accent"
                onClick={() => void setBan(false, p.id)}
              >
                Unban
              </button>
            </li>
          ))}
          {banned.length === 0 ? (
            <li className="py-6 text-center text-xs text-stone-500">No banned users</li>
          ) : null}
        </ul>
      </Panel>
    </div>
  );
}

function ReportsTab({ accessToken }: { accessToken: string }) {
  const [filter, setFilter] = useState<"open" | "reviewing" | "resolved" | "dismissed" | "all">(
    "open",
  );
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [reports, setReports] = useState<
    Array<{
      id: string;
      reason: string;
      details: string;
      status: string;
      created_at: string;
      message_id: string | null;
      dm_message_id: string | null;
      resolution_note: string;
      target_user_id: string | null;
      reporter?: { username: string; tag: string } | { username: string; tag: string }[] | null;
      target?: { username: string; tag: string } | { username: string; tag: string }[] | null;
    }>
  >([]);

  const refresh = useCallback(async () => {
    const r = await adminListReports({
      data: { accessToken, status: filter === "all" ? "all" : filter },
    });
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    setReports(r.reports as unknown as typeof reports);
  }, [accessToken, filter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pickUser = (
    u: { username: string; tag: string } | { username: string; tag: string }[] | null | undefined,
  ) => {
    if (!u) return "—";
    const row = Array.isArray(u) ? u[0] : u;
    return row ? `${row.username}#${row.tag}` : "—";
  };

  const setStatus = async (
    reportId: string,
    status: "open" | "reviewing" | "resolved" | "dismissed",
  ) => {
    const res = await adminSetReportStatus({
      data: {
        accessToken,
        reportId,
        status,
        resolutionNote: noteDrafts[reportId],
      },
    });
    if (!res.ok) toast.error(res.error);
    else {
      toast.success(`Marked ${status}`);
      void refresh();
    }
  };

  return (
    <Panel title="Reports">
      <div className="mb-3 flex flex-wrap gap-2">
        {(["open", "reviewing", "resolved", "dismissed", "all"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
              filter === s
                ? "bg-accent/20 text-accent"
                : "bg-white/5 text-stone-400 hover:text-white"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <ul className="divide-y divide-border-subtle">
        {reports.map((r) => (
          <li key={r.id} className="space-y-2 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-bold text-white">
                {r.reason}{" "}
                <span className="ms-2 text-[10px] font-bold uppercase tracking-widest text-stone-500">
                  {r.status}
                </span>
              </p>
              <span className="text-[10px] uppercase tracking-widest text-stone-500">
                {new Date(r.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-stone-400">{r.details || "No details"}</p>
            <p className="text-[11px] text-stone-500">
              Reporter {pickUser(r.reporter)} → Target {pickUser(r.target)}
              {r.message_id ? ` · msg ${r.message_id.slice(0, 8)}` : ""}
              {r.dm_message_id ? ` · dm ${r.dm_message_id.slice(0, 8)}` : ""}
            </p>
            <input
              value={noteDrafts[r.id] ?? r.resolution_note ?? ""}
              onChange={(e) =>
                setNoteDrafts((prev) => ({ ...prev, [r.id]: e.target.value.slice(0, 500) }))
              }
              placeholder="Resolution note (optional)"
              className="w-full rounded-md border border-border-subtle bg-background px-2 py-1.5 text-xs text-white outline-none focus:border-accent/50"
            />
            <div className="flex flex-wrap gap-2">
              {r.status === "open" ? (
                <button
                  type="button"
                  className="rounded-md bg-accent/15 px-2 py-1 text-[10px] font-bold uppercase text-accent"
                  onClick={() => void setStatus(r.id, "reviewing")}
                >
                  Reviewing
                </button>
              ) : null}
              <button
                type="button"
                className="rounded-md bg-online/15 px-2 py-1 text-[10px] font-bold uppercase text-online"
                onClick={() => void setStatus(r.id, "resolved")}
              >
                Resolve
              </button>
              <button
                type="button"
                className="rounded-md bg-white/5 px-2 py-1 text-[10px] font-bold uppercase text-stone-300"
                onClick={() => void setStatus(r.id, "dismissed")}
              >
                Dismiss
              </button>
              {r.target_user_id ? (
                <button
                  type="button"
                  className="rounded-md bg-danger/15 px-2 py-1 text-[10px] font-bold uppercase text-danger"
                  onClick={async () => {
                    const res = await adminBanUser({
                      data: {
                        accessToken,
                        targetUserId: r.target_user_id!,
                        ban: true,
                        reason: `Report: ${r.reason}`,
                      },
                    });
                    if (!res.ok) toast.error(res.error);
                    else {
                      await adminSetReportStatus({
                        data: {
                          accessToken,
                          reportId: r.id,
                          status: "resolved",
                          resolutionNote: noteDrafts[r.id] || `Banned for ${r.reason}`,
                        },
                      });
                      toast.success("Banned + resolved");
                      void refresh();
                    }
                  }}
                >
                  Ban target
                </button>
              ) : null}
            </div>
          </li>
        ))}
        {reports.length === 0 ? (
          <li className="py-8 text-center text-xs text-stone-500">No reports in this filter</li>
        ) : null}
      </ul>
    </Panel>
  );
}

const inputCls =
  "w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-white outline-none focus:border-accent/50";

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border-subtle bg-surface-mid/40 p-4">
      <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-stone-500">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
