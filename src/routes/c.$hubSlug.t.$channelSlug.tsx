import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Hash, Pin, Users, Search, X, ChevronLeft, List } from "lucide-react";
import { AppShell, Sheet } from "@/components/app-shell";
import { Composer } from "@/components/composer";
import { MessageItem } from "@/components/message-item";
import { LfgBoard } from "@/components/lfg-board";
import { ListSkeleton, ListRow, ConfirmSheet } from "@/components/ui-native";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { useT, translateStatic } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-provider";
import { useHubChat } from "@/hooks/use-hub-chat";
import { useTypingIndicator } from "@/hooks/use-typing-indicator";
import { bumpMessageUnreadRefresh } from "@/hooks/use-message-unread-totals";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { submitReport } from "@/lib/social/api";
import { ReportDialog, type ReportDialogTarget } from "@/components/report-dialog";
import { adminKickFromHub } from "@/lib/admin/api";
import { kickHubMember } from "@/lib/chat/api";
import { canDeleteMessage, canKickTarget, hubCaps } from "@/lib/hub/permissions";
import { isLfgChannel } from "@/lib/lfg";
import { toast } from "sonner";

export const Route = createFileRoute("/c/$hubSlug/t/$channelSlug")({
  head: ({ params }) => ({
    meta: [
      {
        title: translateStatic("meta.page.channel", {
          channel: params.channelSlug,
          hub: params.hubSlug,
        }),
      },
    ],
  }),
  component: CommunityChatPage,
});

function CommunityChatPage() {
  const { hubSlug, channelSlug } = Route.useParams();
  const navigate = useNavigate();
  const chat = useHubChat({
    initialSlug: hubSlug,
    channelKey: channelSlug,
    autoSelectChannel: true,
  });
  const [pinsOpen, setPinsOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [channelsOpen, setChannelsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyTo, setReplyTo] = useState<
    { id?: string; author: string; body: string } | undefined
  >();
  const [reportTarget, setReportTarget] = useState<ReportDialogTarget | null>(null);
  const [kickTarget, setKickTarget] = useState<{ userId: string; name: string } | null>(null);
  const [kickBusy, setKickBusy] = useState(false);
  const { t } = useT();
  const { accessToken, profile, user } = useAuth();
  const isAdmin = useIsAdmin();
  const caps = useMemo(
    () => hubCaps(chat.live ? chat.viewerHubRole : "admin", isAdmin),
    [chat.live, chat.viewerHubRole, isAdmin],
  );

  const { typingNames, notifyTyping } = useTypingIndicator({
    topicKey:
      chat.live && chat.activeChannelId ? `channel:${chat.activeChannelId}` : null,
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
    if (chat.error) toast.error(chat.error);
  }, [chat.error]);

  const clearSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    if (chat.live) void chat.searchMessages("");
  };

  const openChannel = (c: { id: string; slug?: string; name: string }) => {
    const key = c.slug?.trim() || c.id;
    chat.selectChannel(c.id);
    setChannelsOpen(false);
    setSearchQuery("");
    if (chat.live) void chat.searchMessages("");
    void navigate({
      to: "/c/$hubSlug/t/$channelSlug",
      params: { hubSlug, channelSlug: key },
      replace: true,
    });
  };

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim() || chat.live) return chat.messages;
    const q = searchQuery.trim().toLowerCase();
    return chat.messages.filter(
      (m) => m.body.toLowerCase().includes(q) || m.author.toLowerCase().includes(q),
    );
  }, [chat.messages, chat.live, searchQuery]);

  const isLfg = isLfgChannel(chat.activeChannel);
  const allMembers = [...chat.members.online, ...chat.members.offline];

  return (
    <AppShell>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-border-subtle/80 bg-surface-mid/50 px-2 py-2 md:px-4">
          <div className="flex min-w-0 items-center gap-1">
            <Link
              to="/c/$hubSlug"
              params={{ hubSlug }}
              className="nx-press grid size-11 shrink-0 place-items-center rounded-xl text-stone-300 hover:bg-white/5 hover:text-white"
              aria-label={t("community.backToHome")}
            >
              <ChevronLeft className="size-5 rtl:rotate-180" />
            </Link>
            <div className="min-w-0">
              <p className="nx-caption truncate text-stone-500" dir="auto">
                {chat.game.hubName}
              </p>
              <p className="flex items-center gap-1 truncate font-semibold text-white">
                <Hash className="size-3.5 shrink-0 text-accent" />
                <span dir="auto">{chat.activeChannel.name}</span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <IconBtn label={t("community.channels")} onClick={() => setChannelsOpen(true)}>
              <List className="size-4" />
            </IconBtn>
            <IconBtn label={t("home.searchMessages")} onClick={() => setSearchOpen(true)}>
              <Search className="size-4" />
            </IconBtn>
            <IconBtn label={t("home.pinnedTitle")} onClick={() => setPinsOpen(true)}>
              <Pin className="size-4" />
            </IconBtn>
            <IconBtn label={t("home.members")} onClick={() => setMembersOpen(true)}>
              <Users className="size-4" />
            </IconBtn>
          </div>
        </header>

        {chat.activeChannel.topic && !searchQuery ? (
          <div
            className="shrink-0 border-b border-border-subtle/60 bg-black/20 px-4 py-2 text-xs text-stone-400"
            dir="auto"
          >
            {chat.activeChannel.topic}
          </div>
        ) : null}

        {searchQuery ? (
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-accent/20 bg-accent/10 px-4 py-2">
            <span className="text-xs text-accent">
              {t("home.searchResults")}: {searchQuery}
            </span>
            <button type="button" onClick={clearSearch} className="text-xs text-stone-300">
              {t("common.close")}
            </button>
          </div>
        ) : null}

        {isLfg && !searchQuery ? (
          <LfgBoard
            messages={chat.messages}
            onReply={(m) => setReplyTo({ id: m.id, author: m.author, body: m.body })}
          />
        ) : null}

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3 md:space-y-4 md:px-6">
          {chat.loading && chat.live ? (
            <ListSkeleton rows={8} />
          ) : filteredMessages.length === 0 ? (
            searchQuery ? (
              <p className="py-16 text-center text-sm text-stone-500">{t("home.searchEmpty")}</p>
            ) : (
              <EmptyState
                title={t("home.emptyChannel.title")}
                body={t("home.emptyChannel.body")}
                action={
                  <Button variant="secondary" onClick={() => setChannelsOpen(true)}>
                    {t("home.emptyChannel.ctaChannels")}
                  </Button>
                }
              />
            )
          ) : (
            <>
              {chat.hasMoreOlder ? (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={chat.loadingOlder}
                    onClick={() => void chat.loadOlderMessages()}
                  >
                    {t("home.loadOlder")}
                  </Button>
                </div>
              ) : null}
              {filteredMessages.map((m) => (
                <MessageItem
                  key={m.id}
                  msg={m}
                  onReply={(msg) =>
                    setReplyTo({ id: msg.id, author: msg.author, body: msg.body })
                  }
                  onReact={(msg, emoji) => void chat.reactToMessage(msg.id, emoji)}
                  onPin={
                    caps.canPin
                      ? (msg, pinned) => void chat.pinMessage(msg.id, pinned)
                      : undefined
                  }
                  onDelete={
                    canDeleteMessage(caps, m.authorId, user?.id)
                      ? (msg) => void chat.deleteMessage(msg.id)
                      : undefined
                  }
                  onEdit={
                    m.authorId === user?.id
                      ? (msg, body) => void chat.editMessage(msg.id, body)
                      : undefined
                  }
                  onReport={
                    user?.id && m.authorId && m.authorId !== user.id
                      ? (msg) =>
                          setReportTarget({
                            messageId: msg.id,
                            targetUserId: msg.authorId,
                            preview: msg.body.slice(0, 120),
                          })
                      : undefined
                  }
                />
              ))}
            </>
          )}
        </div>

        <Composer
          channelName={chat.activeChannel.name}
          lfgMode={isLfg}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(undefined)}
          typingLabel={typingLabel}
          onTyping={notifyTyping}
          onSend={async (body, replyId, attachment) => {
            const result = await chat.sendMessage(body, replyId, attachment);
            bumpMessageUnreadRefresh();
            return result;
          }}
        />
      </div>

      <Sheet
        open={channelsOpen}
        onClose={() => setChannelsOpen(false)}
        title={t("community.channels")}
      >
        <div className="space-y-1 p-3 pb-6">
          {chat.textChannels.map((c) => (
            <ListRow
              key={c.id}
              title={c.name}
              subtitle={isLfgChannel(c) ? t("home.lfgBadge") : c.topic}
              leading={<Hash className="size-4 text-stone-500" />}
              trailing={
                c.unread ? (
                  <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">
                    {c.unread}
                  </span>
                ) : c.id === chat.activeChannelId ? (
                  <span className="nx-caption text-accent">{t("home.activeChannel")}</span>
                ) : null
              }
              onClick={() => openChannel(c)}
            />
          ))}
          <Button asChild variant="secondary" className="mt-3 w-full">
            <Link
              to="/c/$hubSlug"
              params={{ hubSlug }}
              onClick={() => setChannelsOpen(false)}
            >
              {t("community.backToHome")}
            </Link>
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        title={t("home.searchMessages")}
      >
        <div className="p-3">
          <div className="flex min-h-11 items-center gap-2 rounded-xl border border-border-subtle bg-white/[0.03] px-3">
            <Search className="size-4 text-stone-500" />
            <input
              value={searchQuery}
              onChange={(e) => {
                const v = e.target.value;
                setSearchQuery(v);
                if (chat.live) void chat.searchMessages(v);
              }}
              placeholder={t("home.searchPlaceholder")}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              autoFocus
            />
            {searchQuery ? (
              <button type="button" onClick={clearSearch} aria-label={t("common.close")}>
                <X className="size-4 text-stone-500" />
              </button>
            ) : null}
          </div>
        </div>
      </Sheet>

      <Sheet open={pinsOpen} onClose={() => setPinsOpen(false)} title={t("home.pinnedTitle")}>
        <div className="space-y-1 p-3 pb-6">
          {chat.messages.filter((m) => m.pinned).length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-500">{t("home.pinnedEmpty")}</p>
          ) : (
            chat.messages
              .filter((m) => m.pinned)
              .map((m) => (
                <ListRow
                  key={m.id}
                  title={m.author}
                  subtitle={m.body}
                  trailing={<span className="nx-caption">{m.time}</span>}
                />
              ))
          )}
        </div>
      </Sheet>

      <Sheet open={membersOpen} onClose={() => setMembersOpen(false)} title={t("home.members")}>
        <div className="space-y-4 p-3 pb-6">
          <p className="nx-label text-stone-500">
            {t("home.online")} · {chat.members.online.length}
          </p>
          {allMembers.map((m) => (
            <div
              key={m.userId ?? m.name}
              className="flex min-h-11 items-center justify-between gap-2 rounded-xl px-2 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white" dir="auto">
                  {m.name}
                </p>
                <p className="truncate text-xs text-stone-500">
                  {m.inVoice
                    ? t("home.inVoiceNamed", { name: m.inVoice })
                    : (m.status ?? m.role ?? "")}
                </p>
              </div>
              {m.userId &&
              m.userId !== user?.id &&
              caps.canKick &&
              canKickTarget(chat.viewerHubRole, m.role, isAdmin) ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setKickTarget({ userId: m.userId!, name: m.name })}
                >
                  {t("home.kick")}
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </Sheet>

      <ConfirmSheet
        open={Boolean(kickTarget)}
        onOpenChange={(open) => {
          if (!open) setKickTarget(null);
        }}
        title={t("home.kickTitle")}
        description={
          kickTarget ? t("home.kickConfirm", { name: kickTarget.name }) : undefined
        }
        confirmLabel={t("home.kick")}
        destructive
        busy={kickBusy}
        onConfirm={async () => {
          if (!kickTarget || !chat.activeHubUuid) return;
          setKickBusy(true);
          try {
            if (isAdmin && accessToken) {
              const r = await adminKickFromHub({
                data: {
                  accessToken,
                  hubId: chat.activeHubUuid,
                  userId: kickTarget.userId,
                },
              });
              if (!r.ok) throw new Error(r.error);
            } else {
              const r = await kickHubMember(chat.activeHubUuid, kickTarget.userId);
              if (!r.ok) throw new Error(r.error);
            }
            toast.success(t("toast.kicked", { name: kickTarget.name }));
            setKickTarget(null);
            await chat.refreshMembers();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : t("toast.failed"));
          } finally {
            setKickBusy(false);
          }
        }}
      />

      <ReportDialog
        open={Boolean(reportTarget)}
        onOpenChange={(open) => {
          if (!open) setReportTarget(null);
        }}
        target={reportTarget}
        onSubmit={async (input) => {
          if (!user?.id) return { ok: false, error: "Sign in required" };
          return submitReport({
            reporterId: user.id,
            reason: input.reason,
            details: input.details,
            targetUserId: input.targetUserId ?? reportTarget?.targetUserId,
            messageId: reportTarget?.messageId,
          });
        }}
      />
    </AppShell>
  );
}

function IconBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="nx-press grid size-11 place-items-center rounded-xl text-stone-400 hover:bg-white/5 hover:text-white"
    >
      {children}
    </button>
  );
}
