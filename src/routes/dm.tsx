import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useMemo, useState } from "react";
import { Search, Phone, Video, Pin, UserPlus, MessageSquare } from "lucide-react";
import { MessageItem } from "@/components/message-item";
import { Composer } from "@/components/composer";
import { EmptyState } from "@/components/empty-state";
import { VoiceDock } from "@/components/voice-dock";
import { useT } from "@/lib/i18n";
import { useDms } from "@/hooks/use-dms";
import { useAuth } from "@/lib/auth-provider";
import { getVoiceClient } from "@/lib/voice";
import { toast } from "sonner";

type DmSearch = { thread?: string };

export const Route = createFileRoute("/dm")({
  validateSearch: (search: Record<string, unknown>): DmSearch => ({
    thread: typeof search.thread === "string" ? search.thread : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Direct Messages — Nexus" },
      { name: "description", content: "Your direct conversations on Nexus." },
    ],
  }),
  component: DMPage,
});

function DMPage() {
  const { t } = useT();
  const navigate = useNavigate();
  const { accessToken, profile } = useAuth();
  const { thread: threadFromSearch } = Route.useSearch();
  const [query, setQuery] = useState("");
  const [inVoice, setInVoice] = useState(false);
  const dms = useDms(threadFromSearch);

  const selectThread = (id: string) => {
    dms.setActiveId(id);
    void navigate({ to: "/dm", search: { thread: id }, replace: true });
  };

  const soon = () => toast(t("common.comingSoon"));

  const [joiningVoice, setJoiningVoice] = useState(false);

  const joinDmVoice = async () => {
    if (!dms.activeId || !dms.active || joiningVoice) return;
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
      toast.success(live ? `Joined voice with ${dms.active.with.name}` : t("voice.joinedPreview"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not join voice");
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
  const emptyInbox = !dms.loading && dms.threads.length === 0;

  if (emptyInbox) {
    return (
      <AppShell>
        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 items-center border-b border-border-subtle px-6">
            <h1 className="font-display text-base font-bold uppercase tracking-tight text-white">
              {t("dm.title")}
            </h1>
          </header>
          <EmptyState
            icon={MessageSquare}
            title={t("empty.dms.title")}
            body={t("empty.dms.body")}
            action={
              <Link
                to="/friends"
                className="rounded-lg bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent-foreground"
              >
                {t("empty.dms.cta")}
              </Link>
            }
          />
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <nav className="hidden w-64 shrink-0 flex-col border-e border-border-subtle bg-surface-mid md:flex">
          <header className="flex h-16 items-center border-b border-border-subtle px-5">
            <h1 className="font-display text-base font-bold uppercase tracking-tight text-white">
              {t("dm.title")}
            </h1>
          </header>
          <div className="border-b border-border-subtle p-3">
            <div className="flex items-center gap-2 rounded-lg bg-background px-3 py-2">
              <Search className="size-3.5 text-stone-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("dm.find")}
                className="min-w-0 flex-1 bg-transparent text-xs text-stone-300 outline-none placeholder:text-stone-600"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <Link
              to="/friends"
              className="mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-400 hover:bg-white/5 hover:text-white"
            >
              <UserPlus className="size-4" />
              {t("dm.new")}
            </Link>
            <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-stone-500">
              {t("dm.recent")}
            </div>
            {conversations.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-stone-500">{t("empty.search.body")}</p>
            ) : (
              conversations.map((c) => {
                const isActive = c.id === dms.activeId;
                return (
                  <button
                    key={c.id}
                    onClick={() => selectThread(c.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start transition-colors ${
                      isActive ? "bg-white/5" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="size-9 rounded-full bg-stone-800" />
                      <div
                        className={`absolute bottom-0 size-2.5 rounded-full border-2 border-surface-mid ltr:right-0 rtl:left-0 ${
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
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p
                          className={`truncate text-sm ${isActive ? "font-bold text-white" : "font-semibold text-stone-300"}`}
                        >
                          {c.with.name}
                        </p>
                        <span className="text-[10px] text-stone-600">{c.lastTime}</span>
                      </div>
                      <p className="truncate text-xs text-stone-500">{c.lastMessage}</p>
                    </div>
                    {c.unread > 0 && (
                      <span className="grid size-5 place-items-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">
                        {c.unread}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </nav>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-border-subtle bg-surface-mid/60 md:hidden">
            <div className="flex h-12 items-center gap-2 px-3">
              <h1 className="min-w-0 flex-1 font-display text-sm font-bold uppercase tracking-tight text-white">
                {t("dm.title")}
              </h1>
              <Link
                to="/friends"
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent/15 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-accent"
              >
                <UserPlus className="size-3.5" />
                {t("dm.new")}
              </Link>
            </div>
            <div className="flex items-center gap-2 px-3 pb-2">
              <Search className="size-3.5 shrink-0 text-stone-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("dm.find")}
                className="min-w-0 flex-1 rounded-lg bg-background px-3 py-1.5 text-xs text-stone-300 outline-none placeholder:text-stone-600"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto px-3 pb-2 no-scrollbar">
              {conversations.map((c) => {
                const isActive = c.id === dms.activeId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectThread(c.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isActive
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border-subtle text-stone-400"
                    }`}
                  >
                    <span className="size-6 rounded-full bg-stone-800" />
                    <span className="max-w-[7rem] truncate">{c.with.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {!active ? (
            <EmptyState
              icon={MessageSquare}
              title={t("empty.dms.title")}
              body={t("empty.dms.body")}
              action={
                <Link
                  to="/friends"
                  className="rounded-lg bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wide text-accent-foreground"
                >
                  {t("empty.dms.cta")}
                </Link>
              }
            />
          ) : (
            <>
              <header className="flex h-16 shrink-0 items-center justify-between border-b border-border-subtle bg-surface-mid/30 px-4 backdrop-blur-md md:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="size-8 rounded-full bg-stone-800" />
                    <div className="absolute bottom-0 size-2.5 rounded-full border-2 border-background bg-online ltr:right-0 rtl:left-0" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{active.with.name}</p>
                    <p className="truncate text-[10px] uppercase tracking-tight text-stone-500">
                      {active.with.activity ?? "Online"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void joinDmVoice()}
                    disabled={joiningVoice || inVoice}
                    className="grid size-9 place-items-center rounded-lg text-stone-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
                    aria-label={t("dm.voice")}
                  >
                    <Phone className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={soon}
                    title={t("common.comingSoon")}
                    className="grid size-9 place-items-center rounded-lg text-stone-500 opacity-60 hover:bg-white/5 hover:text-stone-400"
                    aria-label={`${t("dm.video")} — ${t("common.comingSoon")}`}
                  >
                    <Video className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={soon}
                    title={t("common.comingSoon")}
                    className="grid size-9 place-items-center rounded-lg text-stone-500 opacity-60 hover:bg-white/5 hover:text-stone-400"
                    aria-label={`${t("dm.pinned")} — ${t("common.comingSoon")}`}
                  >
                    <Pin className="size-4" />
                  </button>
                </div>
              </header>

              <div className="flex-1 space-y-6 overflow-y-auto p-4 md:space-y-8 md:p-6">
                <div className="pb-4 text-center">
                  <div className="mx-auto mb-3 size-16 rounded-full bg-stone-800" />
                  <h2 className="font-display text-xl font-bold uppercase tracking-tight text-white">
                    {active.with.name}
                  </h2>
                  <p className="text-xs text-stone-500">
                    {t("dm.start", { name: active.with.name })}
                  </p>
                </div>
                {dms.messages.map((m) => (
                  <MessageItem key={m.id} msg={m} />
                ))}
              </div>

              {inVoice && (
                <VoiceDock
                  channelName={active.with.name}
                  gameName="DM"
                  onDisconnect={() => {
                    void getVoiceClient().leaveVoiceChannel();
                    setInVoice(false);
                  }}
                />
              )}
              <Composer
                channelName={active.with.name}
                onSend={async (body, _replyToId, attachment) => {
                  const result = await dms.send(body, attachment);
                  if (!result.ok) {
                    toast.error(result.error ?? "Send failed");
                    return result;
                  }
                  return { ok: true };
                }}
              />
            </>
          )}
        </main>
      </div>
    </AppShell>
  );
}
