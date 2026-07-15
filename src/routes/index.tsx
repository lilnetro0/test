import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Hash, Pin, Users, ChevronDown, Search, X } from "lucide-react";
import { GAMES, type HubCard } from "@/lib/mock-data";
import { AppShell, Sheet } from "@/components/app-shell";
import { Composer } from "@/components/composer";
import { MessageItem } from "@/components/message-item";
import { VoiceDock } from "@/components/voice-dock";
import { UserHoverCard } from "@/components/user-hover-card";
import { useT } from "@/lib/i18n";
import { getHubOrder, setHubOrder } from "@/lib/prefs";
import { getVoiceClient } from "@/lib/voice";
import { useAuth } from "@/lib/auth-provider";
import { useHubChat } from "@/hooks/use-hub-chat";
import { useTypingIndicator } from "@/hooks/use-typing-indicator";
import { bumpMessageUnreadRefresh } from "@/hooks/use-message-unread-totals";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { submitReport } from "@/lib/social/api";
import { ReportDialog, type ReportDialogTarget } from "@/components/report-dialog";
import { adminKickFromHub, adminSetHubRole } from "@/lib/admin/api";
import { kickHubMember, setHubMemberRole } from "@/lib/chat/api";
import { canDeleteMessage, canKickTarget, hubCaps } from "@/lib/hub/permissions";
import type { HubRole } from "@/lib/supabase/types";
import { toast } from "sonner";

export type HomeSearch = {
  hub?: string;
  hubs?: "1";
};

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    const next: HomeSearch = {};
    if (typeof search.hub === "string" && search.hub.trim()) {
      next.hub = search.hub.trim();
    }
    if (search.hubs === "1" || search.hubs === 1 || search.hubs === true) {
      next.hubs = "1";
    }
    return next;
  },
  head: () => ({
    meta: [
      { title: "Nexus — Voice & Chat for Gamers" },
      {
        name: "description",
        content:
          "Nexus is a game-first chat & voice app. Jump between game hubs from the bottom dock. Zero learning curve.",
      },
    ],
  }),
  component: NexusApp,
});

function NexusApp() {
  const { hub: hubFromSearch, hubs: openHubsFromSearch } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const chat = useHubChat({ initialSlug: hubFromSearch });
  const [hubSheetOpen, setHubSheetOpen] = useState(false);
  const [pinsOpen, setPinsOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyTo, setReplyTo] = useState<
    { id?: string; author: string; body: string } | undefined
  >();
  const [voiceChannel, setVoiceChannel] = useState<{ id: string; name: string } | null>(null);
  const [joiningVoice, setJoiningVoice] = useState(false);
  const [hubOrder, setHubOrderState] = useState<string[]>(() => GAMES.map((g) => g.id));
  const [dragId, setDragId] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportDialogTarget | null>(null);
  const { t } = useT();
  const { configured, prefs, savePrefs, accessToken, profile, user } = useAuth();
  const isAdmin = useIsAdmin();
  const reporterId = user?.id;
  const caps = useMemo(
    () => hubCaps(chat.live ? chat.viewerHubRole : "admin", isAdmin),
    [chat.live, chat.viewerHubRole, isAdmin],
  );

  const { typingNames, notifyTyping } = useTypingIndicator({
    topicKey:
      chat.live && chat.activeChannelId
        ? `channel:${chat.activeChannelId}`
        : null,
    userId: user?.id,
    username: profile?.username ?? chat.profileName,
    enabled: chat.live,
  });

  const typingLabel = useMemo(() => {
    if (!typingNames.length) return null;
    if (typingNames.length === 1) return `${typingNames[0]} ${t("home.typing.single")}`;
    return `${typingNames.slice(0, 3).join(", ")} ${t("home.typing.plural")}`;
  }, [typingNames, t]);

  useEffect(() => {
    const fallback = chat.games.map((g) => g.id);
    if (configured && prefs?.hub_order && Array.isArray(prefs.hub_order) && prefs.hub_order.length) {
      setHubOrderState(getHubOrder(prefs.hub_order as string[]));
      return;
    }
    setHubOrderState(getHubOrder(fallback.length ? fallback : GAMES.map((g) => g.id)));
  }, [configured, prefs, chat.games]);

  const orderedGames = useMemo(() => {
    const byId = new Map(chat.games.map((g) => [g.id, g]));
    const ordered = hubOrder.map((id) => byId.get(id)).filter(Boolean) as HubCard[];
    const seen = new Set(ordered.map((g) => g.id));
    for (const g of chat.games) {
      if (!seen.has(g.id)) ordered.push(g);
    }
    return ordered.length ? ordered : chat.games;
  }, [hubOrder, chat.games]);

  const game = useMemo<HubCard>(
    () => orderedGames.find((g) => g.id === chat.activeSlug) ?? chat.game,
    [orderedGames, chat.activeSlug, chat.game],
  );

  const filteredMessages = useMemo(() => {
    if (chat.live) return chat.messages;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return chat.messages;
    return chat.messages.filter(
      (m) => m.body.toLowerCase().includes(q) || m.author.toLowerCase().includes(q),
    );
  }, [chat.live, chat.messages, searchQuery]);

  // Live: search against DB (body ilike)
  useEffect(() => {
    if (!chat.live || !searchOpen) return;
    const handle = window.setTimeout(() => {
      void chat.searchMessages(searchQuery);
    }, 280);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- searchMessages identity changes often
  }, [chat.live, searchOpen, searchQuery, chat.activeChannelId]);

  useEffect(() => {
    if (chat.error) toast.error(chat.error);
  }, [chat.error]);

  useEffect(() => {
    if (openHubsFromSearch !== "1") return;
    setHubSheetOpen(true);
    void navigate({
      search: (prev) => ({ ...prev, hubs: undefined }),
      replace: true,
    });
  }, [openHubsFromSearch, navigate]);

  const selectGame = (id: string) => {
    chat.selectGame(id);
    setSearchQuery("");
    if (searchOpen && chat.live) void chat.searchMessages("");
  };

  const onDropReorder = useCallback(
    (targetId: string) => {
      if (!dragId || dragId === targetId) {
        setDragId(null);
        return;
      }
      setHubOrderState((prev) => {
        const next = [...prev];
        const from = next.indexOf(dragId);
        const to = next.indexOf(targetId);
        if (from < 0 || to < 0) return prev;
        next.splice(from, 1);
        next.splice(to, 0, dragId);
        setHubOrder(next);
        if (configured) void savePrefs({ hub_order: next });
        return next;
      });
      setDragId(null);
    },
    [dragId, configured, savePrefs],
  );

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    if (chat.live) void chat.searchMessages("");
  };

  return (
    <AppShell onBrandClick={() => setHubSheetOpen(true)} brandActive={hubSheetOpen}>
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border-subtle bg-surface-mid/40 px-3 backdrop-blur-md md:h-16 md:px-6">
        <button
          onClick={() => setHubSheetOpen(true)}
          className="flex min-w-0 items-center gap-3 rounded-xl border border-border-subtle bg-white/[0.03] px-3 py-1.5 text-start transition-colors hover:border-accent/40"
        >
          <span
            className={`grid size-8 shrink-0 place-items-center rounded-lg font-display text-[10px] font-bold ${game.tint} ${game.textTint}`}
          >
            {game.short}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-[11px] font-bold uppercase tracking-tight text-white">
              {game.hubName}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-stone-500">
              <Hash className="size-3" />
              <span className="truncate">{chat.activeChannel.name}</span>
            </span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-stone-500 ltr:ms-1 rtl:me-1" />
        </button>

        <div className="flex shrink-0 items-center gap-1">
          {chat.live ? (
            <div className="hidden items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1.5 sm:flex">
              <span className="size-2 rounded-full bg-accent shadow-[var(--shadow-glow-accent)]" />
              <span className="text-[11px] font-bold uppercase tracking-tight text-stone-400">
                {game.activeCount} {t("home.live")}
              </span>
            </div>
          ) : (
            <div className="hidden items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 sm:flex">
              <span className="text-[11px] font-bold uppercase tracking-tight text-amber-100/90">
                {t("home.demoLive")}
              </span>
            </div>
          )}
          <button
            onClick={() => {
              if (searchOpen) closeSearch();
              else setSearchOpen(true);
            }}
            className={`grid size-9 place-items-center rounded-lg transition-colors ${
              searchOpen ? "bg-accent/15 text-accent" : "text-stone-400 hover:bg-white/5 hover:text-white"
            }`}
            aria-label={t("home.searchMessages")}
            aria-pressed={searchOpen}
          >
            <Search className="size-4" />
          </button>
          <button
            onClick={() =>
              window.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true }),
              )
            }
            className="hidden items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-stone-400 hover:border-accent/40 hover:text-white md:flex"
            aria-label={t("nav.openPalette")}
            title={t("home.searchHint") + " (⌘K)"}
          >
            <kbd className="font-mono text-[10px]">⌘K</kbd>
          </button>
          <button
            type="button"
            onClick={() => setPinsOpen(true)}
            title={`${chat.pinnedCount} ${t("home.pinned")}`}
            aria-label={`${chat.pinnedCount} ${t("home.pinned")}`}
            className="relative grid size-9 place-items-center rounded-lg text-stone-400 hover:bg-white/5 hover:text-white"
          >
            <Pin className="size-4" />
            {chat.pinnedCount > 0 ? (
              <span className="absolute -top-0.5 grid size-4 place-items-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground ltr:-right-0.5 rtl:-left-0.5">
                {chat.pinnedCount > 9 ? "9+" : chat.pinnedCount}
              </span>
            ) : null}
          </button>
          <button
            onClick={() => setMembersOpen(true)}
            className="grid size-9 place-items-center rounded-lg text-stone-400 hover:bg-white/5 hover:text-white"
            aria-label={t("home.members")}
          >
            <Users className="size-4" />
          </button>
        </div>
      </header>

      {searchOpen && (
        <div className="flex items-center gap-2 border-b border-border-subtle bg-surface-mid/60 px-4 py-2 md:px-6">
          <Search className="size-4 shrink-0 text-stone-500" />
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("home.searchPlaceholder")}
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-stone-600"
          />
          {searchQuery && (
            <span className="shrink-0 text-[10px] uppercase tracking-widest text-stone-500">
              {filteredMessages.length} {t("home.searchResults")}
            </span>
          )}
          <button
            onClick={closeSearch}
            className="grid size-8 place-items-center rounded-lg text-stone-500 hover:text-white"
            aria-label={t("home.close")}
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {chat.activeChannel.topic && !searchOpen && (
        <div className="border-b border-border-subtle bg-background/40 px-4 py-2 md:px-6">
          <p className="truncate text-xs text-stone-500">{chat.activeChannel.topic}</p>
        </div>
      )}

      {chat.loading && chat.live && (
        <div className="border-b border-border-subtle px-4 py-2 text-center text-xs text-stone-500 md:px-6">
          Loading hub…
        </div>
      )}

      <div
        role="log"
        aria-live="polite"
        aria-label={`${chat.activeChannel.name} messages`}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3 md:space-y-8 md:p-6"
      >
        {!searchOpen && chat.live && chat.hasMoreOlder && (
          <div className="flex justify-center pb-2">
            <button
              type="button"
              disabled={chat.loadingOlder}
              onClick={() => {
                void chat.loadOlderMessages().then((result) => {
                  if (!result.ok) toast.error(result.error ?? t("msg.err.loadOlder"));
                });
              }}
              className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs text-stone-400 hover:border-stone-600 hover:text-stone-200 disabled:opacity-50"
            >
              {chat.loadingOlder ? t("home.loadingOlder") : t("home.loadOlder")}
            </button>
          </div>
        )}
        {searchQuery && filteredMessages.length === 0 ? (
          <p className="py-12 text-center text-sm text-stone-500">{t("home.searchEmpty")}</p>
        ) : (
          filteredMessages.map((m) => (
            <MessageItem
              key={m.id}
              msg={m}
              onReply={(msg) =>
                setReplyTo({ id: msg.id, author: msg.author, body: msg.body })
              }
              onPin={
                caps.canPin
                  ? async (msg, pinned) => {
                      if (!chat.live) {
                        const result = await chat.pinMessage(msg.id, pinned);
                        if (!result.ok) toast.error(result.error ?? t("msg.err.pin"));
                        else toast.success(pinned ? t("msg.pinned") : t("msg.unpinned"));
                        return;
                      }
                      const result = await chat.pinMessage(
                        msg.id,
                        pinned,
                        isAdmin ? accessToken ?? undefined : undefined,
                      );
                      if (!result.ok) toast.error(result.error ?? t("msg.err.pin"));
                      else toast.success(pinned ? t("msg.pinned") : t("msg.unpinned"));
                    }
                  : undefined
              }
              onReport={
                m.authorId && m.authorId !== user?.id
                  ? (msg) => {
                      setReportTarget({
                        messageId: msg.id,
                        targetUserId: msg.authorId,
                        preview: msg.body.slice(0, 200),
                      });
                    }
                  : undefined
              }
              onDelete={
                canDeleteMessage(caps, m.authorId, user?.id)
                  ? async (msg) => {
                      const result = await chat.deleteMessage(
                        msg.id,
                        isAdmin && chat.live ? accessToken ?? undefined : undefined,
                      );
                      if (!result.ok) toast.error(result.error ?? t("msg.err.delete"));
                      else toast.success(t("msg.deleted"));
                    }
                  : undefined
              }
              onEdit={
                !chat.live || (m.authorId && m.authorId === user?.id)
                  ? async (msg, body) => {
                      const result = await chat.editMessage(msg.id, body);
                      if (!result.ok) toast.error(result.error ?? t("msg.err.edit"));
                    }
                  : undefined
              }
              onReact={async (msg, emoji) => {
                const result = await chat.reactToMessage(msg.id, emoji);
                if (!result.ok) toast.error(result.error ?? t("msg.err.react"));
              }}
            />
          ))
        )}
      </div>

      {voiceChannel && (
        <VoiceDock
          channelName={voiceChannel.name}
          gameName={game.name}
          onDisconnect={() => setVoiceChannel(null)}
        />
      )}

      <Composer
        channelName={chat.activeChannel.name}
        gameId={chat.activeSlug}
        mentionMembers={chat.members.online}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(undefined)}
        onTyping={notifyTyping}
        typingLabel={typingLabel}
        onSend={async (body, replyToId, attachment) => {
          const result = await chat.sendMessage(body, replyToId, attachment);
          if (!result.ok) {
            toast.error(result.error ?? t("msg.err.send"));
            return result;
          }
          bumpMessageUnreadRefresh();
          return { ok: true };
        }}
      />

      <Sheet open={pinsOpen} onClose={() => setPinsOpen(false)} title={t("home.pinnedTitle")}>
        <div className="space-y-4 p-4">
          {chat.messages.filter((m) => m.pinned).length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-500">{t("home.pinnedEmpty")}</p>
          ) : (
            chat.messages
              .filter((m) => m.pinned)
              .map((m) => (
                <div key={m.id} className="rounded-xl border border-border-subtle bg-surface-mid/40 p-3">
                  <p className="text-xs font-bold text-white">
                    {m.author}{" "}
                    <span className="font-normal text-stone-500">{m.time}</span>
                  </p>
                  <p className="mt-1 text-sm text-stone-300">{m.body}</p>
                </div>
              ))
          )}
        </div>
      </Sheet>

      <Sheet open={hubSheetOpen} onClose={() => setHubSheetOpen(false)} title={t("home.hubs")}>
        <div className="grid grid-cols-1 divide-y divide-border-subtle md:grid-cols-[220px_1fr] md:divide-x md:divide-y-0">
          <div className="p-3">
            <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-stone-500">
              {t("home.reorderHint")}
            </p>
            <div className="grid grid-cols-4 gap-2 md:grid-cols-2">
              {orderedGames.map((g) => {
                const active = g.id === chat.activeSlug;
                return (
                  <button
                    key={g.id}
                    draggable
                    onDragStart={() => setDragId(g.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDropReorder(g.id)}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => selectGame(g.id)}
                    className={`group flex cursor-grab flex-col items-center gap-1.5 rounded-xl border p-2 transition-all active:cursor-grabbing ${
                      active
                        ? "border-accent bg-accent/10 shadow-[var(--shadow-glow-accent)]"
                        : "border-border-subtle bg-white/[0.02] hover:border-accent/40"
                    } ${dragId === g.id ? "opacity-50" : ""}`}
                  >
                    <span
                      className={`grid size-10 place-items-center rounded-lg font-display text-[11px] font-bold ${g.tint} ${g.textTint}`}
                    >
                      {g.short}
                    </span>
                    <span className="w-full truncate text-center text-[10px] font-semibold text-stone-300">
                      {g.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3">
            <h4 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-stone-500">
              {t("home.text")} — {game.name}
            </h4>
            <div className="mb-4 space-y-0.5">
              {chat.textChannels.map((c) => {
                const active = c.id === chat.activeChannelId;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      chat.selectChannel(c.id);
                      setHubSheetOpen(false);
                      setSearchQuery("");
                      if (searchOpen && chat.live) void chat.searchMessages("");
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-white/5 font-medium text-white"
                        : "text-stone-400 hover:bg-white/5 hover:text-stone-200"
                    }`}
                  >
                    <Hash className={`size-3.5 ${active ? "text-accent" : "text-stone-600"}`} />
                    <span className="truncate">{c.name}</span>
                    {c.unread ? (
                      <span className="ms-auto grid size-5 place-items-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">
                        {c.unread}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <h4 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-stone-500">
              {t("home.voice")}
            </h4>
            <div className="space-y-1">
              {chat.voiceChannels.map((v) => {
                const hasMembers = v.members.length > 0;
                return (
                  <button
                    key={v.id}
                    disabled={joiningVoice}
                    onClick={() => {
                      if (joiningVoice) return;
                      const roomName =
                        v.livekitRoomName ?? `nexus-${chat.activeSlug}-${v.id}`;
                      void (async () => {
                        setJoiningVoice(true);
                        try {
                          await getVoiceClient().joinVoiceChannel({
                            channelId: v.id,
                            channelName: v.name,
                            roomName,
                            accessToken,
                            displayName: profile?.username ?? user?.email?.split("@")[0],
                          });
                          setVoiceChannel({ id: v.id, name: v.name });
                          setHubSheetOpen(false);
                          const live = getVoiceClient().getSession()?.live;
                          toast.success(
                            live ? t("voice.joinOk", { name: v.name }) : t("voice.joinedPreview"),
                          );
                        } catch (err) {
                          toast.error(
                            err instanceof Error ? err.message : t("voice.joinFail"),
                          );
                        } finally {
                          setJoiningVoice(false);
                        }
                      })();
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-400 transition-colors hover:bg-white/5 hover:text-stone-200 disabled:opacity-50"
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        hasMembers
                          ? "bg-online shadow-[var(--shadow-glow-online)]"
                          : "bg-stone-600"
                      }`}
                    />
                    <span className="truncate">{v.name}</span>
                    {hasMembers && (
                      <span className="ms-auto font-mono text-[10px] text-stone-500">
                        {v.members.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Sheet>

      <Sheet
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        title={`${game.name} — ${t("home.roster")}`}
        side="right"
      >
        <div className="space-y-8 p-5">
          <section>
            <h4 className="mb-3 px-1 text-[10px] font-bold uppercase tracking-widest text-stone-500">
              {t("home.online")} — {chat.members.online.length}
            </h4>
            <div className="space-y-3">
              {chat.members.online.map((m) => (
                <div key={m.name} className="space-y-1">
                  <UserHoverCard member={m}>
                    <button className="flex w-full items-center gap-3 rounded-md px-2 py-1 text-start transition-colors hover:bg-white/5">
                      <div className="relative shrink-0">
                        <div className="size-9 rounded-full bg-stone-800" />
                        <div className="absolute bottom-0 size-2.5 rounded-full border-2 border-surface-mid bg-online ltr:right-0 rtl:left-0" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs font-bold text-white">{m.name}</p>
                          {m.role === "admin" && (
                            <span className="rounded bg-accent/15 px-1 text-[8px] font-bold uppercase tracking-widest text-accent">
                              {t("home.admin")}
                            </span>
                          )}
                          {m.role === "mod" && (
                            <span className="rounded bg-amber-500/15 px-1 text-[8px] font-bold uppercase tracking-widest text-amber-200">
                              mod
                            </span>
                          )}
                        </div>
                        {m.inVoice ? (
                          <p className="truncate text-[9px] font-bold uppercase tracking-tight text-accent">
                            In {m.inVoice}
                          </p>
                        ) : (
                          <p className="truncate text-[9px] uppercase tracking-tight text-stone-500">
                            {m.status ?? "Online"}
                          </p>
                        )}
                      </div>
                    </button>
                  </UserHoverCard>
                  {chat.live &&
                  m.userId &&
                  chat.activeHubUuid &&
                  (caps.canSetRole ||
                    canKickTarget(chat.viewerHubRole, m.role, isAdmin)) ? (
                    <div className="flex flex-wrap gap-1 px-2 pb-1">
                      {caps.canSetRole
                        ? (["member", "mod", "admin"] as HubRole[]).map((role) => (
                            <button
                              key={role}
                              type="button"
                              onClick={async () => {
                                const hubId = chat.activeHubUuid!;
                                const userId = m.userId!;
                                const r = isAdmin && accessToken
                                  ? await adminSetHubRole({
                                      data: { accessToken, hubId, userId, role },
                                    })
                                  : await setHubMemberRole(hubId, userId, role);
                                if (!r.ok) toast.error(r.error ?? t("toast.failed"));
                                else {
                                  toast.success(t("toast.roleSet", { name: m.name, role }));
                                  void chat.refreshMembers();
                                }
                              }}
                              className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                m.role === role
                                  ? "bg-accent/20 text-accent"
                                  : "bg-white/5 text-stone-500 hover:text-white"
                              }`}
                            >
                              {role}
                            </button>
                          ))
                        : null}
                      {canKickTarget(chat.viewerHubRole, m.role, isAdmin) &&
                      m.userId !== user?.id ? (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(`Kick ${m.name} from hub?`)) return;
                            const hubId = chat.activeHubUuid!;
                            const userId = m.userId!;
                            const r = isAdmin && accessToken
                              ? await adminKickFromHub({
                                  data: { accessToken, hubId, userId },
                                })
                              : await kickHubMember(hubId, userId);
                            if (!r.ok) toast.error(r.error ?? t("toast.failed"));
                            else {
                              toast.success(t("toast.kicked", { name: m.name }));
                              void chat.refreshMembers();
                            }
                          }}
                          className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase text-danger hover:bg-danger/15"
                        >
                          Kick
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="opacity-60">
            <h4 className="mb-3 px-1 text-[10px] font-bold uppercase tracking-widest text-stone-500">
              {t("home.offline")} — {chat.members.offline.length}
            </h4>
            <div className="space-y-3">
              {chat.members.offline.map((m) => (
                <div key={m.name} className="flex items-center gap-3 px-2">
                  <div className="size-8 shrink-0 rounded-full border border-white/5 bg-stone-800/50" />
                  <span className="truncate text-xs text-stone-400">{m.name}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </Sheet>

      <ReportDialog
        open={!!reportTarget}
        onOpenChange={(open) => {
          if (!open) setReportTarget(null);
        }}
        target={reportTarget}
        onSubmit={async ({ reason, details }) => {
          if (!chat.live || !reporterId || !reportTarget) {
            toast.success(t("report.thanks"));
            return { ok: true };
          }
          const result = await submitReport({
            reporterId,
            messageId: reportTarget.messageId,
            targetUserId: reportTarget.targetUserId,
            reason,
            details: details || reportTarget.preview,
          });
          if (!result.ok) {
            toast.error(result.error ?? t("msg.err.report"));
            return result;
          }
          toast.success(t("report.thanks"));
          return { ok: true };
        }}
      />
    </AppShell>
  );
}
