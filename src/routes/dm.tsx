import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useMemo, useState, useEffect } from "react";
import { Search, Phone, UserPlus, MessageSquare, ChevronLeft } from "lucide-react";
import { MessageItem } from "@/components/message-item";
import { Composer } from "@/components/composer";
import { EmptyState } from "@/components/empty-state";
import { ScreenHeader, ListRow } from "@/components/ui-native";
import { Button } from "@/components/ui/button";
import { useT, translateStatic } from "@/lib/i18n";
import { useDms } from "@/hooks/use-dms";
import { useTypingIndicator } from "@/hooks/use-typing-indicator";
import { bumpMessageUnreadRefresh } from "@/hooks/use-message-unread-totals";
import { useAuth } from "@/lib/auth-provider";
import { getVoiceClient } from "@/lib/voice";
import { usePlatformFlags } from "@/hooks/use-platform-flags";
import { toast } from "sonner";
import { submitReport } from "@/lib/social/api";
import { ReportDialog, type ReportDialogTarget } from "@/components/report-dialog";

type DmSearch = { thread?: string };

export const Route = createFileRoute("/dm")({
  validateSearch: (search: Record<string, unknown>): DmSearch => ({
    thread: typeof search.thread === "string" ? search.thread : undefined,
  }),
  head: () => ({
    meta: [
      { title: translateStatic("meta.page.dm") },
      { name: "description", content: "Your direct conversations on Nexus." },
    ],
  }),
  component: DMPage,
});

function DMPage() {
  const { t } = useT();
  const navigate = useNavigate();
  const { accessToken, profile, user } = useAuth();
  const flags = usePlatformFlags();
  const voiceEnabled = flags["voice.enabled"];
  const { thread: threadFromSearch } = Route.useSearch();
  const [query, setQuery] = useState("");
  const [inVoice, setInVoice] = useState(false);
  const dms = useDms(threadFromSearch);

  const { typingNames, notifyTyping } = useTypingIndicator({
    topicKey: dms.live && dms.activeId ? `dm:${dms.activeId}` : null,
    userId: user?.id,
    username: profile?.username ?? dms.profileName,
    enabled: dms.live,
  });

  const typingLabel = useMemo(() => {
    if (!typingNames.length) return null;
    if (typingNames.length === 1) return `${typingNames[0]} ${t("home.typing.single")}`;
    return `${typingNames.slice(0, 3).join(", ")} ${t("home.typing.plural")}`;
  }, [typingNames, t]);

  const selectThread = (id: string) => {
    dms.setActiveId(id);
    void navigate({ to: "/dm", search: { thread: id }, replace: true });
  };

  const closeThread = () => {
    dms.setActiveId(null);
    void navigate({ to: "/dm", search: {}, replace: true });
  };

  const [joiningVoice, setJoiningVoice] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportDialogTarget | null>(null);

  useEffect(() => {
    setInVoice(Boolean(getVoiceClient().getSession()?.connected));
    return getVoiceClient().onSessionChange?.((s) => {
      setInVoice(Boolean(s?.connected));
    });
  }, []);

  const joinDmVoice = async () => {
    if (!dms.activeId || !dms.active || joiningVoice) return;
    if (!voiceEnabled) {
      toast.error(t("notice.flag.voiceOff"));
      return;
    }
    setJoiningVoice(true);
    try {
      await getVoiceClient().joinVoiceChannel({
        channelId: dms.activeId,
        threadId: dms.activeId,
        channelName: dms.active.with.name,
        roomName: `nexus-dm-${dms.activeId}`,
        accessToken,
        displayName: profile?.username ?? dms.profileName,
      });
      setInVoice(true);
      const live = getVoiceClient().getSession()?.live;
      toast.success(
        live
          ? t("voice.joinDmOk", { name: dms.active.with.name })
          : t("voice.joinedPreview"),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("voice.joinFail"));
    } finally {
      setJoiningVoice(false);
    }
  };

  const conversations = useMemo(
    () =>
      dms.threads.filter(
        (c) =>
          c.with.name.toLowerCase().includes(query.toLowerCase()) ||
          c.lastMessage.toLowerCase().includes(query.toLowerCase()),
      ),
    [dms.threads, query],
  );

  const active = dms.active;
  /** Mobile: thread only when deep-linked / selected via search. */
  const mobileThreadOpen = Boolean(threadFromSearch) && Boolean(active);
  const emptyInbox = !dms.loading && dms.threads.length === 0;

  const inboxList = (
    <>
      <div className="border-b border-border-subtle p-3">
        <div className="flex min-h-11 items-center gap-2 rounded-lg border border-border-subtle bg-white/[0.03] px-3">
          <Search className="size-3.5 text-stone-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("dm.find")}
            className="min-w-0 flex-1 bg-transparent text-sm text-stone-300 outline-none placeholder:text-stone-600"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ListRow
          title={t("dm.new")}
          leading={<UserPlus className="size-4 text-accent" />}
          onClick={() => void navigate({ to: "/friends" })}
        />
        <p className="nx-section px-4 py-2">{t("dm.recent")}</p>
        {conversations.length === 0 ? (
          <p className="nx-body px-4 py-6 text-center">{t("empty.search.body")}</p>
        ) : (
          conversations.map((c) => (
            <ListRow
              key={c.id}
              title={c.with.name}
              subtitle={c.lastMessage}
              muted={c.unread === 0 && c.id !== dms.activeId}
              leading={
                <div className="relative shrink-0">
                  <div className="size-10 rounded-full bg-stone-800" />
                  <div
                    className={`absolute bottom-0 end-0 size-2.5 rounded-full border-2 border-surface-mid ${
                      c.with.status === "online"
                        ? "bg-online"
                        : c.with.status === "dnd"
                          ? "bg-danger"
                          : c.with.status === "idle"
                            ? "bg-amber-400"
                            : "bg-stone-600"
                    }`}
                  />
                </div>
              }
              trailing={
                <div className="flex flex-col items-end gap-1">
                  <span className="nx-caption">{c.lastTime}</span>
                  {c.unread > 0 ? (
                    <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">
                      {c.unread}
                    </span>
                  ) : null}
                </div>
              }
              onClick={() => selectThread(c.id)}
            />
          ))
        )}
      </div>
    </>
  );

  if (emptyInbox) {
    return (
      <AppShell>
        <main className="flex min-w-0 flex-1 flex-col">
          <ScreenHeader title={t("dm.title")} />
          <EmptyState
            icon={MessageSquare}
            title={t("empty.dms.title")}
            body={t("empty.dms.body")}
            primaryAction={
              <Button type="button" variant="accent" size="touch" onClick={() => void navigate({ to: "/friends" })}>
                {t("empty.dms.cta")}
              </Button>
            }
          />
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Desktop sidebar inbox */}
        <nav className="hidden w-72 shrink-0 flex-col border-e border-border-subtle bg-surface-mid md:flex">
          <ScreenHeader title={t("dm.title")} />
          {inboxList}
        </nav>

        <main className="flex min-w-0 flex-1 flex-col">
          {/* Mobile: inbox when no thread */}
          <div className={`min-h-0 flex-1 flex-col md:hidden ${mobileThreadOpen ? "hidden" : "flex"}`}>
            <ScreenHeader
              title={t("dm.title")}
              trailing={
                <Button type="button" variant="ghost" size="sm" onClick={() => void navigate({ to: "/friends" })}>
                  {t("dm.new")}
                </Button>
              }
            />
            {inboxList}
          </div>

          {/* Thread: mobile when open; desktop always in main */}
          <div
            className={`min-h-0 flex-1 flex-col ${
              mobileThreadOpen ? "flex" : "hidden md:flex"
            }`}
          >
            {!active ? (
              <EmptyState
                icon={MessageSquare}
                title={t("empty.dms.title")}
                body={t("empty.dms.body")}
                primaryAction={
                  <Button
                    type="button"
                    variant="accent"
                    size="touch"
                    onClick={() => void navigate({ to: "/friends" })}
                  >
                    {t("empty.dms.cta")}
                  </Button>
                }
              />
            ) : (
              <>
                <header className="flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-border-subtle px-3 md:min-h-16 md:px-6">
                  <div className="flex min-w-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={closeThread}
                      className="nx-touch grid place-items-center rounded-lg text-stone-400 hover:bg-white/5 hover:text-white md:hidden"
                      aria-label={t("common.back")}
                    >
                      <ChevronLeft className="size-5 rtl:rotate-180" />
                    </button>
                    <div className="relative shrink-0">
                      <div className="size-8 rounded-full bg-stone-800" />
                      <div className="absolute bottom-0 end-0 size-2.5 rounded-full border-2 border-background bg-online" />
                    </div>
                    <div className="min-w-0">
                      <p className="nx-label truncate">{active.with.name}</p>
                      <p className="nx-caption truncate">{active.with.activity ?? t("you.online")}</p>
                    </div>
                  </div>
                  {voiceEnabled ? (
                    <button
                      type="button"
                      onClick={() => void joinDmVoice()}
                      disabled={joiningVoice || inVoice}
                      className="nx-touch grid place-items-center rounded-lg text-stone-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
                      aria-label={t("dm.voice")}
                    >
                      <Phone className="size-4" />
                    </button>
                  ) : null}
                </header>

                <div className="flex-1 space-y-3 overflow-y-auto p-3 md:space-y-4 md:p-6">
                  <div className="pb-2 text-center">
                    <div className="mx-auto mb-3 size-14 rounded-full bg-stone-800" />
                    <h2 className="nx-title">{active.with.name}</h2>
                    <p className="nx-body mt-1">{t("dm.start", { name: active.with.name })}</p>
                  </div>
                  {dms.messages.map((m) => (
                    <MessageItem
                      key={m.id}
                      msg={m}
                      onReport={
                        m.authorId && m.authorId !== user?.id
                          ? (msg) => {
                              setReportTarget({
                                dmMessageId: msg.id,
                                targetUserId: msg.authorId,
                                preview: msg.body.slice(0, 200),
                              });
                            }
                          : undefined
                      }
                      onDelete={
                        m.authorId && m.authorId === user?.id
                          ? async (msg) => {
                              const result = await dms.deleteMessage(msg.id);
                              if (!result.ok) toast.error(result.error ?? t("msg.err.delete"));
                              else toast.success(t("msg.deleted"));
                            }
                          : undefined
                      }
                    />
                  ))}
                </div>

                <Composer
                  channelName={active.with.name}
                  onTyping={notifyTyping}
                  typingLabel={typingLabel}
                  onSend={async (body, _replyToId, attachment) => {
                    const result = await dms.send(body, attachment);
                    if (!result.ok) {
                      toast.error(result.error ?? t("msg.err.send"));
                      return result;
                    }
                    bumpMessageUnreadRefresh();
                    return { ok: true };
                  }}
                />
              </>
            )}
          </div>
        </main>
      </div>

      <ReportDialog
        open={!!reportTarget}
        onOpenChange={(open) => {
          if (!open) setReportTarget(null);
        }}
        target={reportTarget}
        onSubmit={async ({ reason, details, targetUserId }) => {
          if (!dms.live || !user?.id || !reportTarget) {
            toast.success(t("report.thanks"));
            return { ok: true };
          }
          const result = await submitReport({
            reporterId: user.id,
            dmMessageId: reportTarget.dmMessageId,
            targetUserId: targetUserId ?? reportTarget.targetUserId,
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
