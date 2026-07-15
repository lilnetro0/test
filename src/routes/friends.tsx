import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import type { Friend } from "@/lib/mock-data";
import { useState } from "react";
import { MessageSquare, Phone, X, UserPlus, Search, Users, Ban, Unlock } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { useT, type TKey } from "@/lib/i18n";
import { useFriends } from "@/hooks/use-friends";
import type { PendingRequest } from "@/lib/social/api";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/friends")({
  head: () => ({
    meta: [
      { title: "Friends — Nexus" },
      { name: "description", content: "Manage your gaming friends on Nexus." },
    ],
  }),
  component: FriendsPage,
});

const TABS: { id: string; key: TKey }[] = [
  { id: "Online", key: "friends.tab.online" },
  { id: "All", key: "friends.tab.all" },
  { id: "Pending", key: "friends.tab.pending" },
  { id: "Blocked", key: "friends.tab.blocked" },
];

function FriendsPage() {
  const [tab, setTab] = useState("Online");
  const [query, setQuery] = useState("");
  const { t } = useT();
  const navigate = useNavigate();
  const social = useFriends();

  const filtered = social.friends.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase()),
  );
  const online = filtered.filter((f) => f.status !== "offline");

  const openDm = async (f: Friend) => {
    if (!social.live || !f.id) {
      toast(t("toast.openingDm", { name: f.name }));
      void navigate({ to: "/dm" });
      return;
    }
    const result = await social.startDm(f.id);
    if (!result.ok) {
      toast.error(result.error ?? t("toast.dmOpenFail"));
      return;
    }
    void navigate({ to: "/dm", search: { thread: result.threadId } });
  };

  return (
    <AppShell>
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border-subtle px-4 md:gap-4 md:px-6">
          <h1 className="shrink-0 font-display text-base font-bold uppercase tracking-tight text-white">
            {t("friends.title")}
          </h1>
          <div className="h-4 w-px shrink-0 bg-border-subtle" />
          <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto no-scrollbar">
            {TABS.map((tabItem) => (
              <button
                key={tabItem.id}
                type="button"
                onClick={() => setTab(tabItem.id)}
                className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tab === tabItem.id
                    ? "bg-white/5 text-white"
                    : "text-stone-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {t(tabItem.key)}
                {tabItem.id === "Pending" && social.incoming.length > 0 && (
                  <span className="ms-1.5 rounded bg-danger px-1.5 py-0.5 text-[9px] font-bold text-white">
                    {social.incoming.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setTab("Add Friend")}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors sm:px-3 sm:text-xs ${
              tab === "Add Friend"
                ? "bg-online/20 text-online"
                : "bg-online/15 text-online hover:bg-online/25"
            }`}
          >
            <UserPlus className="size-3.5" />
            <span className="max-sm:sr-only">{t("friends.tab.add")}</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 pb-8 md:px-6">
          {tab === "Add Friend" ? (
            <AddFriend
              onSend={async (tag) => {
                if (!social.live) {
                  toast.success(t("toast.friendSent"));
                  return;
                }
                const result = await social.sendRequest(tag);
                if (!result.ok) toast.error(result.error ?? t("toast.failed"));
                else toast.success(t("toast.friendSent"));
              }}
            />
          ) : tab === "Pending" ? (
            <PendingList
              requests={social.incoming}
              onAccept={async (req) => {
                if (!social.live) {
                  toast.success(t("toast.friendAdded", { name: req.name }));
                  return;
                }
                const result = await social.accept(req.requestId);
                if (!result.ok) toast.error(result.error ?? t("toast.failed"));
                else toast.success(t("toast.friendAdded", { name: req.name }));
              }}
              onDecline={async (req) => {
                if (!social.live) {
                  toast(t("toast.declined", { name: req.name }));
                  return;
                }
                const result = await social.decline(req.requestId);
                if (!result.ok) toast.error(result.error ?? t("toast.failed"));
                else toast(t("toast.declined", { name: req.name }));
              }}
            />
          ) : tab === "Blocked" ? (
            social.blocked.length === 0 ? (
              <EmptyState
                icon={Users}
                title={t("empty.blocked.title")}
                body={t("empty.blocked.body")}
              />
            ) : (
              <FriendsList
                friends={social.blocked}
                query={query}
                setQuery={setQuery}
                label={`${t("friends.tab.blocked")} — ${social.blocked.length}`}
                onAdd={() => setTab("Add Friend")}
                mode="blocked"
                onUnblock={async (f) => {
                  if (!social.live || !f.id) {
                    toast.success(t("toast.unblocked", { name: f.name }));
                    return;
                  }
                  const result = await social.unblock(f.id);
                  if (!result.ok) toast.error(result.error ?? t("toast.failed"));
                  else toast.success(t("toast.unblocked", { name: f.name }));
                }}
              />
            )
          ) : (
            <FriendsList
              friends={tab === "Online" ? online : filtered}
              query={query}
              setQuery={setQuery}
              label={
                tab === "Online"
                  ? `${t("friends.tab.online")} — ${online.length}`
                  : `${t("friends.tab.all")} — ${filtered.length}`
              }
              onAdd={() => setTab("Add Friend")}
              onMessage={(f) => void openDm(f)}
              onBlock={async (f) => {
                if (!social.live || !f.id) {
                  toast.success(t("toast.blocked", { name: f.name }));
                  return;
                }
                const result = await social.block(f.id);
                if (!result.ok) toast.error(result.error ?? t("toast.failed"));
                else toast.success(t("toast.blocked", { name: f.name }));
              }}
            />
          )}
        </div>
      </main>
    </AppShell>
  );
}

function FriendsList({
  friends,
  query,
  setQuery,
  label,
  onAdd,
  onMessage,
  onBlock,
  onUnblock,
  mode = "friends",
}: {
  friends: Friend[];
  query: string;
  setQuery: (v: string) => void;
  label: string;
  onAdd: () => void;
  onMessage?: (f: Friend) => void;
  onBlock?: (f: Friend) => void | Promise<void>;
  onUnblock?: (f: Friend) => void | Promise<void>;
  mode?: "friends" | "blocked";
}) {
  const { t } = useT();
  const isMobile = useIsMobile();

  return (
    <>
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-mid px-3 py-2">
        <Search className="size-4 text-stone-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("friends.search")}
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-stone-600"
        />
      </div>

      {friends.length === 0 ? (
        <EmptyState
          icon={query ? Search : Users}
          title={query ? t("empty.search.title") : t("empty.friends.title")}
          body={query ? t("empty.search.body") : t("empty.friends.body")}
          action={
            !query ? (
              <button
                onClick={onAdd}
                className="rounded-lg bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent-foreground"
              >
                {t("empty.friends.cta")}
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-stone-500">
            {label}
          </h3>
          <div className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface-mid/30">
            {friends.map((f) => (
              <div
                key={f.id ?? f.tag}
                className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/[0.03]"
              >
                <div className="relative shrink-0">
                  <div className="size-10 rounded-full bg-stone-800" />
                  <div
                    className={`absolute bottom-0 size-3 rounded-full border-2 border-background ltr:right-0 rtl:left-0 ${
                      f.status === "online"
                        ? "bg-online"
                        : f.status === "idle"
                          ? "bg-amber-400"
                          : f.status === "dnd"
                            ? "bg-danger"
                            : "bg-stone-600"
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <Link
                      to="/profile/$username"
                      params={{ username: f.name }}
                      className="truncate text-sm font-bold text-white hover:underline"
                    >
                      {f.name}
                    </Link>
                    <span className="font-mono text-[10px] text-stone-600">{f.tag}</span>
                  </div>
                  <p className="truncate text-xs text-stone-400">
                    {f.activity ?? f.status.toUpperCase()}
                  </p>
                </div>
                <div
                  className={`flex transition-opacity ${
                    isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  {mode === "blocked" ? (
                    <button
                      onClick={() => void onUnblock?.(f)}
                      className="grid size-9 place-items-center rounded-md bg-white/5 text-stone-300 hover:text-online"
                      aria-label={t("friends.unblock")}
                      title={t("friends.unblock")}
                    >
                      <Unlock className="size-4" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => onMessage?.(f)}
                        className="grid size-9 place-items-center rounded-md bg-white/5 text-stone-300 hover:text-white"
                        aria-label={t("friends.message")}
                      >
                        <MessageSquare className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toast(t("profile.callSoon"))}
                        title={t("common.comingSoon")}
                        className="ms-1 grid size-9 place-items-center rounded-md bg-white/5 text-stone-500 opacity-60 hover:bg-white/5 hover:text-stone-400"
                        aria-label={`${t("friends.call")} — ${t("common.comingSoon")}`}
                      >
                        <Phone className="size-4" />
                      </button>
                      <button
                        onClick={() => void onBlock?.(f)}
                        className="grid size-9 place-items-center rounded-md bg-white/5 text-stone-300 hover:text-danger ms-1"
                        aria-label={t("friends.block")}
                        title={t("friends.block")}
                      >
                        <Ban className="size-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function PendingList({
  requests,
  onAccept,
  onDecline,
}: {
  requests: PendingRequest[];
  onAccept: (req: PendingRequest) => void | Promise<void>;
  onDecline: (req: PendingRequest) => void | Promise<void>;
}) {
  const { t } = useT();
  if (requests.length === 0) {
    return (
      <EmptyState icon={UserPlus} title={t("empty.pending.title")} body={t("empty.pending.body")} />
    );
  }
  return (
    <>
      <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-stone-500">
        {t("friends.incoming")} — {requests.length}
      </h3>
      <div className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface-mid/30">
        {requests.map((f) => (
          <div key={f.requestId} className="flex items-center gap-4 px-4 py-3">
            <div className="size-10 shrink-0 rounded-full bg-stone-800" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">
                {f.name}{" "}
                <span className="ms-1 font-mono text-[10px] text-stone-600">{f.tag}</span>
              </p>
              <p className="truncate text-xs text-stone-400">{t("friends.incomingHint")}</p>
            </div>
            <button
              onClick={() => void onAccept(f)}
              className="grid size-9 place-items-center rounded-md bg-online/15 text-online hover:bg-online/25"
              aria-label={t("friends.accept")}
            >
              ✓
            </button>
            <button
              onClick={() => void onDecline(f)}
              className="grid size-9 place-items-center rounded-md bg-danger/15 text-danger hover:bg-danger/25"
              aria-label={t("friends.decline")}
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function AddFriend({ onSend }: { onSend: (usernameTag: string) => void | Promise<void> }) {
  const { t } = useT();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="max-w-xl">
      <h2 className="font-display text-lg font-bold uppercase tracking-tight text-white">
        {t("friends.addTitle")}
      </h2>
      <p className="mt-1 text-sm text-stone-400">{t("friends.addBody")}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const tag = value.trim();
          if (!tag || busy) return;
          setBusy(true);
          void Promise.resolve(onSend(tag)).finally(() => {
            setBusy(false);
            setValue("");
          });
        }}
        className="mt-4 flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-mid p-2"
      >
        <UserPlus className="size-4 text-stone-500 ms-2" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Username#0000"
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-stone-600"
        />
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="rounded-md bg-accent px-4 py-2 text-xs font-bold uppercase tracking-widest text-accent-foreground disabled:opacity-50"
        >
          {t("friends.sendRequest")}
        </button>
      </form>
    </div>
  );
}
