import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppNav } from "@/components/app-nav";
import { AppShell } from "@/components/app-shell";
import type { Friend } from "@/lib/mock-data";
import { useState } from "react";
import { MessageSquare, X, UserPlus, Search, Users, Ban, Unlock } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { ScreenHeader } from "@/components/ui-native";
import { Button } from "@/components/ui/button";
import { useT, type TKey, translateStatic } from "@/lib/i18n";
import { useFriends } from "@/hooks/use-friends";
import type { PendingRequest } from "@/lib/social/api";

export const Route = createFileRoute("/friends")({
  head: () => ({
    meta: [
      { title: translateStatic("meta.page.friends") },
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
        <ScreenHeader
          title={t("friends.title")}
          trailing={
            <Button
              type="button"
              variant={tab === "Add Friend" ? "accent" : "ghost"}
              size="sm"
              onClick={() => setTab("Add Friend")}
            >
              <UserPlus className="size-3.5" />
              <span className="max-sm:sr-only">{t("friends.tab.add")}</span>
            </Button>
          }
        />
        <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-border-subtle px-3 py-2 no-scrollbar md:px-6">
          {TABS.map((tabItem) => (
            <button
              key={tabItem.id}
              type="button"
              onClick={() => setTab(tabItem.id)}
              className={`min-h-9 shrink-0 rounded-lg px-3 text-xs font-semibold transition-colors ${
                tab === tabItem.id
                  ? "bg-white/5 text-white"
                  : "text-stone-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {t(tabItem.key)}
              {tabItem.id === "Pending" && social.incoming.length > 0 ? (
                <span className="ms-1.5 rounded bg-danger px-1.5 py-0.5 text-[9px] font-bold text-white">
                  {social.incoming.length}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto px-0 py-2 pb-8 md:px-0">
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

  return (
    <>
      <div className="mb-2 flex min-h-11 items-center gap-2 border-b border-border-subtle px-4 md:px-6">
        <Search className="size-4 text-stone-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("friends.search")}
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-stone-600"
        />
      </div>

      {friends.length === 0 ? (
        <EmptyState
          icon={query ? Search : Users}
          title={query ? t("empty.search.title") : t("empty.friends.title")}
          body={query ? t("empty.search.body") : t("empty.friends.body")}
          primaryAction={
            !query ? (
              <Button type="button" variant="accent" size="touch" onClick={onAdd}>
                {t("empty.friends.cta")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="nx-section px-4 py-2 md:px-6">{label}</p>
          <div className="divide-y divide-border-subtle">
            {friends.map((f) => (
              <div
                key={f.id ?? f.tag}
                className="flex min-h-14 items-center gap-3 px-4 py-2 md:px-6"
              >
                <div className="relative shrink-0">
                  <div className="size-10 rounded-full bg-stone-800" />
                  <div
                    className={`absolute bottom-0 end-0 size-2.5 rounded-full border-2 border-background ${
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
                    <AppNav
                      to="/profile/$username"
                      params={{ username: f.name }}
                      className="nx-label truncate text-start hover:underline"
                    >
                      {f.name}
                    </AppNav>
                    <span className="nx-caption font-mono">{f.tag}</span>
                  </div>
                  <p className="nx-caption truncate">{f.activity ?? f.status}</p>
                </div>
                <div className="flex shrink-0">
                  {mode === "blocked" ? (
                    <button
                      type="button"
                      onClick={() => void onUnblock?.(f)}
                      className="nx-touch grid place-items-center rounded-lg text-stone-300 hover:bg-white/5 hover:text-online"
                      aria-label={t("friends.unblock")}
                    >
                      <Unlock className="size-4" />
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onMessage?.(f)}
                        className="nx-touch grid place-items-center rounded-lg text-stone-300 hover:bg-white/5 hover:text-white"
                        aria-label={t("friends.message")}
                      >
                        <MessageSquare className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void onBlock?.(f)}
                        className="nx-touch grid place-items-center rounded-lg text-stone-300 hover:bg-white/5 hover:text-danger"
                        aria-label={t("friends.block")}
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
    <div className="px-4 md:px-6">
      <p className="nx-section py-2">
        {t("friends.incoming")} — {requests.length}
      </p>
      <div className="divide-y divide-border-subtle">
        {requests.map((f) => (
          <div key={f.requestId} className="flex min-h-14 items-center gap-3 py-2">
            <div className="size-10 shrink-0 rounded-full bg-stone-800" />
            <div className="min-w-0 flex-1">
              <p className="nx-label truncate">
                {f.name} <span className="nx-caption font-mono">{f.tag}</span>
              </p>
              <p className="nx-caption truncate">{t("friends.incomingHint")}</p>
            </div>
            <button
              type="button"
              onClick={() => void onAccept(f)}
              className="nx-touch grid place-items-center rounded-lg bg-online/15 text-online"
              aria-label={t("friends.accept")}
            >
              ✓
            </button>
            <button
              type="button"
              onClick={() => void onDecline(f)}
              className="nx-touch grid place-items-center rounded-lg bg-danger/15 text-danger"
              aria-label={t("friends.decline")}
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddFriend({ onSend }: { onSend: (usernameTag: string) => void | Promise<void> }) {
  const { t } = useT();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto max-w-xl px-4 py-4 md:px-6">
      <h2 className="nx-title">{t("friends.addTitle")}</h2>
      <p className="nx-body mt-1">{t("friends.addBody")}</p>
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
        className="mt-4 flex min-h-11 items-center gap-2 rounded-xl border border-border-subtle bg-white/[0.03] p-1.5"
      >
        <UserPlus className="ms-2 size-4 text-stone-500" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Username#0000"
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-stone-600"
        />
        <Button type="submit" variant="accent" size="sm" disabled={busy || !value.trim()}>
          {t("friends.sendRequest")}
        </Button>
      </form>
    </div>
  );
}
