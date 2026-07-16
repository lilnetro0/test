import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AtSign, UserPlus, Volume2, Info, CheckCheck, Bell, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { ScreenHeader, ListRow } from "@/components/ui-native";
import { Button } from "@/components/ui/button";
import { useT, translateStatic } from "@/lib/i18n";
import { useNotifications } from "@/lib/notifications-provider";
import type { NotificationItem } from "@/lib/mock-data";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: translateStatic("meta.page.notifications") },
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
        <ScreenHeader
          title={
            <>
              {t("notif.title")}
              {unreadCount > 0 ? (
                <span className="ms-2 rounded bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                  {unreadCount}
                </span>
              ) : null}
            </>
          }
          trailing={
            items.length > 0 && unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  void markAllRead().then(() => toast(t("notif.markAll")));
                }}
                className="nx-touch flex items-center gap-2 rounded-md bg-white/5 px-3 text-xs font-semibold text-stone-300 hover:text-white"
              >
                <CheckCheck className="size-3.5" /> {t("notif.markAll")}
              </button>
            ) : null
          }
        />
        <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={t("empty.notifications.title")}
              body={t("empty.notifications.body")}
              primaryAction={
                <Button asChild variant="accent" size="touch">
                  <Link to="/friends">{t("nav.friends")}</Link>
                </Button>
              }
              secondaryAction={
                <Button asChild variant="ghost" size="touch">
                  <Link to="/discover">{t("nav.discover")}</Link>
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-border-subtle">
              {items.map((n) => {
                const Icon = ICONS[n.kind] ?? Info;
                return (
                  <ListRow
                    key={n.id}
                    muted={n.read}
                    onClick={() => void openItem(n)}
                    leading={
                      <div className="relative grid size-10 place-items-center rounded-full bg-accent/10 text-accent">
                        <Icon className="size-4" />
                        {!n.read ? (
                          <span className="absolute end-0 top-0 size-2 rounded-full bg-accent" />
                        ) : null}
                      </div>
                    }
                    title={n.title}
                    subtitle={n.body}
                    trailing={<span className="nx-caption shrink-0">{n.time}</span>}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
