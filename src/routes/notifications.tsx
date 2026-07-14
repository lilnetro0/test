import { createFileRoute, useRouter } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AtSign, UserPlus, Volume2, Info, CheckCheck, Bell, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { useT } from "@/lib/i18n";
import { useNotifications } from "@/lib/notifications-provider";
import type { NotificationItem } from "@/lib/mock-data";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Nexus" },
      { name: "description", content: "All your Nexus notifications in one place." },
    ],
  }),
  component: NotificationsPage,
});

const ICONS = {
  mention: AtSign,
  friend: UserPlus,
  voice: Volume2,
  system: Info,
  dm: MessageSquare,
};

function NotificationsPage() {
  const { t } = useT();
  const router = useRouter();
  const { items, unreadCount, markAllRead, markRead } = useNotifications();

  const openItem = async (n: NotificationItem) => {
    if (!n.read) await markRead(n.id);
    if (!n.href) return;
    router.history.push(n.href);
  };

  return (
    <AppShell>
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border-subtle px-6">
          <h1 className="font-display text-base font-bold uppercase tracking-tight text-white">
            {t("notif.title")}
            {unreadCount > 0 && (
              <span className="ms-2 rounded bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                {unreadCount}
              </span>
            )}
          </h1>
          {items.length > 0 && unreadCount > 0 && (
            <button
              onClick={() => {
                void markAllRead().then(() => toast(t("notif.markAll")));
              }}
              className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-1.5 text-xs font-semibold text-stone-300 hover:text-white"
            >
              <CheckCheck className="size-3.5" /> {t("notif.markAll")}
            </button>
          )}
        </header>
        <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-6 py-6">
          {items.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={t("empty.notifications.title")}
              body={t("empty.notifications.body")}
            />
          ) : (
            <div className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface-mid/30">
              {items.map((n) => {
                const Icon = ICONS[n.kind] ?? Info;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => void openItem(n)}
                    className={`flex w-full items-start gap-4 px-4 py-4 text-start transition-colors hover:bg-white/[0.03] ${
                      n.read ? "opacity-60" : ""
                    }`}
                  >
                    <div className="relative grid size-10 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
                      <Icon className="size-4" />
                      {!n.read && (
                        <span className="absolute end-0 top-0 size-2 rounded-full bg-accent" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`truncate text-sm ${
                            n.read ? "font-medium text-stone-300" : "font-semibold text-white"
                          }`}
                        >
                          {n.title}
                        </p>
                        <span className="shrink-0 text-[10px] text-stone-500">{n.time}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-stone-400">{n.body}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
