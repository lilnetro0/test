import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home,
  Compass,
  MessageSquare,
  Users,
  Bell,
  Settings,
  HelpCircle,
  Hash,
  User,
  Gamepad2,
  Shield,
} from "lucide-react";
import {
  GAMES,
  DISCOVER_HUBS,
  HUBS,
  FRIENDS,
  DM_CONVERSATIONS,
  type Friend,
  type HubCard,
  type DMConversation,
} from "@/lib/mock-data";
import { useHotkey } from "@/hooks/use-hotkey";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useT } from "@/lib/i18n";
import { shouldUseMockData } from "@/lib/supabase/env";
import { useAuth } from "@/lib/auth-provider";
import { fetchLiveHubs } from "@/lib/chat/api";
import { fetchDmThreads, fetchFriends } from "@/lib/social/api";

/**
 * Global command palette. Opens with ⌘K / Ctrl+K. Jumps to any page,
 * game hub, channel, friend, or DM conversation.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useT();
  const live = !shouldUseMockData();
  const { user } = useAuth();
  const isAdmin = useIsAdmin();

  const [hubs, setHubs] = useState<HubCard[]>(GAMES);
  const [friends, setFriends] = useState<Friend[]>(FRIENDS);
  const [dms, setDms] = useState<DMConversation[]>(DM_CONVERSATIONS);

  useHotkey("mod+k", () => setOpen((v) => !v), { allowInInputs: true });
  useHotkey("esc", () => setOpen(false), { allowInInputs: true });

  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(() => {
      (document.querySelector("[cmdk-input]") as HTMLInputElement | null)?.focus();
    }, 10);
    return () => clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open || !live) {
      if (!live) {
        setHubs(GAMES);
        setFriends(FRIENDS);
        setDms(DM_CONVERSATIONS);
      }
      return;
    }
    let cancelled = false;
    void Promise.all([
      fetchLiveHubs(),
      user ? fetchFriends(user.id) : Promise.resolve({ friends: [] as Friend[] }),
      user ? fetchDmThreads(user.id) : Promise.resolve({ threads: [] as DMConversation[] }),
    ]).then(([h, f, d]) => {
      if (cancelled) return;
      setHubs(h.hubs.map((x) => x.game));
      setFriends(f.friends);
      setDms(d.threads);
    });
    return () => {
      cancelled = true;
    };
  }, [open, live, user?.id]);

  const go = (path: string) => {
    setOpen(false);
    navigate({ to: path as never });
  };

  const goHub = (slug: string) => {
    setOpen(false);
    void navigate({ to: "/c/$hubSlug", params: { hubSlug: slug } });
  };

  const goDm = (threadId: string) => {
    setOpen(false);
    void navigate({ to: "/dm", search: { thread: threadId } });
  };

  const discoverExtra = live
    ? []
    : Array.from(new Map([...GAMES, ...DISCOVER_HUBS].map((g) => [g.id, g])).values()).slice(
        GAMES.length,
      );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command shouldFilter>
        <CommandInput placeholder={t("cmd.placeholder")} />
        <CommandList>
          <CommandEmpty>{t("cmd.empty")}</CommandEmpty>

          <CommandGroup heading={t("cmd.navigate")}>
            <CommandItem onSelect={() => go("/")}>
              <Home className="me-2 size-4" /> {t("nav.home")}
            </CommandItem>
            <CommandItem onSelect={() => go("/discover")}>
              <Compass className="me-2 size-4" /> {t("nav.discover")}
            </CommandItem>
            <CommandItem onSelect={() => go("/dm")}>
              <MessageSquare className="me-2 size-4" /> {t("nav.messages")}
            </CommandItem>
            <CommandItem onSelect={() => go("/friends")}>
              <Users className="me-2 size-4" /> {t("nav.friends")}
            </CommandItem>
            <CommandItem onSelect={() => go("/notifications")}>
              <Bell className="me-2 size-4" /> {t("nav.notifications")}
            </CommandItem>
            <CommandItem onSelect={() => go("/settings")}>
              <Settings className="me-2 size-4" /> {t("nav.settings")}
            </CommandItem>
            <CommandItem onSelect={() => go("/help")}>
              <HelpCircle className="me-2 size-4" /> {t("nav.help")}
            </CommandItem>
            {isAdmin && (
              <CommandItem onSelect={() => go("/control")} value="control admin nexus">
                <Shield className="me-2 size-4" /> {t("cmd.control")}
              </CommandItem>
            )}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading={t("cmd.yourHubs")}>
            {hubs.map((g) => (
              <CommandItem
                key={g.id}
                value={`hub ${g.name} ${g.hubName}`}
                onSelect={() => goHub(g.id)}
              >
                <Gamepad2 className="me-2 size-4" />
                <span className="flex-1">{g.hubName}</span>
                <span className="text-[10px] text-muted-foreground">{g.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          {!live && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t("cmd.channels")}>
                {Object.entries(HUBS).flatMap(([gameId, hub]) =>
                  hub.textChannels.map((c) => (
                    <CommandItem
                      key={`${gameId}-${c.id}`}
                      value={`channel ${c.name} ${gameId}`}
                      onSelect={() => goHub(gameId)}
                    >
                      <Hash className="me-2 size-4" />
                      <span className="flex-1">{c.name}</span>
                      <span className="text-[10px] text-muted-foreground">{gameId}</span>
                    </CommandItem>
                  )),
                )}
              </CommandGroup>
            </>
          )}

          <CommandSeparator />

          <CommandGroup heading={t("cmd.people")}>
            {friends.slice(0, 12).map((f) => (
              <CommandItem
                key={f.id ?? f.name}
                value={`friend ${f.name}`}
                onSelect={() => go(`/profile/${encodeURIComponent(f.name)}`)}
              >
                <User className="me-2 size-4" />
                <span className="flex-1">{f.name}</span>
                <span className="text-[10px] uppercase text-muted-foreground">{f.status}</span>
              </CommandItem>
            ))}
            {dms.map((d) => (
              <CommandItem
                key={`dm-${d.id}`}
                value={`dm ${d.with.name}`}
                onSelect={() => goDm(d.id)}
              >
                <MessageSquare className="me-2 size-4" />
                <span className="flex-1">{d.with.name}</span>
                <span className="text-[10px] text-muted-foreground">{t("cmd.dm")}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          {discoverExtra.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t("cmd.discover")}>
                {discoverExtra.map((g) => (
                  <CommandItem
                    key={g.id}
                    value={`discover ${g.name}`}
                    onSelect={() => go("/discover")}
                  >
                    <Compass className="me-2 size-4" />
                    <span className="flex-1">{g.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {t("cmd.members", { n: g.members.toLocaleString() })}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
