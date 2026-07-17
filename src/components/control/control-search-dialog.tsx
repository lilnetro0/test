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
import { Gamepad2, LayoutDashboard, ScrollText, Users, Building2 } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import { controlSearch, type ControlSearchResult } from "@/lib/control/api";
import { useT } from "@/lib/i18n";

/**
 * Control ⌘K — Global Search entry (users / hubs / games) + jump commands.
 * Blueprint §5.1–5.2 (P0 subset).
 */
export function ControlSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useT();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [q, setQ] = useState("");
  const [result, setResult] = useState<ControlSearchResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setQ("");
      setResult(null);
      setBusy(false);
      return;
    }
    const timeout = setTimeout(() => {
      (document.querySelector("[cmdk-input]") as HTMLInputElement | null)?.focus();
    }, 10);
    return () => clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open || !accessToken) return;
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResult(null);
      setBusy(false);
      return;
    }
    let cancelled = false;
    const handle = window.setTimeout(() => {
      setBusy(true);
      void controlSearch({ data: { accessToken, q: trimmed, limit: 8 } }).then((r) => {
        if (cancelled) return;
        setBusy(false);
        if (r.ok) setResult(r);
        else setResult(null);
      });
    }, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [q, open, accessToken]);

  const go = (path: string, search?: Record<string, string>) => {
    onOpenChange(false);
    void navigate({ to: path as "/control", search: search as never });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command shouldFilter={false}>
        <CommandInput
          placeholder={t("control.search.placeholder")}
          value={q}
          onValueChange={setQ}
        />
        <CommandList>
          <CommandEmpty>
            {busy ? t("control.search.searching") : t("control.search.empty")}
          </CommandEmpty>

          <CommandGroup heading={t("control.search.commands")}>
            <CommandItem onSelect={() => go("/control")} value="dashboard">
              <LayoutDashboard className="me-2 size-4" />
              {t("control.nav.dashboard")}
            </CommandItem>
            <CommandItem
              onSelect={() => go("/control/search", q.trim() ? { q: q.trim() } : undefined)}
              value="search page"
            >
              <Gamepad2 className="me-2 size-4" />
              {t("control.search.openFull")}
            </CommandItem>
            <CommandItem onSelect={() => go("/control/audit")} value="audit">
              <ScrollText className="me-2 size-4" />
              {t("control.nav.audit")}
            </CommandItem>
            <CommandItem onSelect={() => go("/control/moderation")} value="moderation queue">
              <LayoutDashboard className="me-2 size-4" />
              {t("control.nav.moderation")}
            </CommandItem>
            <CommandItem onSelect={() => go("/control/users")} value="users directory">
              <Users className="me-2 size-4" />
              {t("control.nav.users")}
            </CommandItem>
            <CommandItem onSelect={() => go("/control/communities")} value="communities">
              <Building2 className="me-2 size-4" />
              {t("control.nav.communities")}
            </CommandItem>
            <CommandItem onSelect={() => go("/control/games")} value="games catalog">
              <Gamepad2 className="me-2 size-4" />
              {t("control.nav.catalog")}
            </CommandItem>
            <CommandItem onSelect={() => go("/control/voice")} value="voice ops">
              <LayoutDashboard className="me-2 size-4" />
              {t("control.nav.voice")}
            </CommandItem>
            <CommandItem onSelect={() => go("/control/live")} value="live sessions">
              <LayoutDashboard className="me-2 size-4" />
              {t("control.nav.live")}
            </CommandItem>
            <CommandItem onSelect={() => go("/control/analytics")} value="analytics">
              <LayoutDashboard className="me-2 size-4" />
              {t("control.nav.analytics")}
            </CommandItem>
            <CommandItem onSelect={() => go("/control/community-health")} value="community health">
              <Building2 className="me-2 size-4" />
              {t("control.nav.communityHealth")}
            </CommandItem>
            <CommandItem onSelect={() => go("/control/system")} value="system health">
              <LayoutDashboard className="me-2 size-4" />
              {t("control.nav.health")}
            </CommandItem>
            <CommandItem onSelect={() => go("/control/flags")} value="feature flags">
              <LayoutDashboard className="me-2 size-4" />
              {t("control.nav.flags")}
            </CommandItem>
            <CommandItem onSelect={() => go("/control/inbox")} value="inbox">
              <LayoutDashboard className="me-2 size-4" />
              {t("control.nav.notifications")}
            </CommandItem>
            <CommandItem onSelect={() => go("/control/growth")} value="growth">
              <LayoutDashboard className="me-2 size-4" />
              {t("control.nav.growth")}
            </CommandItem>
          </CommandGroup>

          {result &&
            (result.users.length > 0 || result.hubs.length > 0 || result.games.length > 0) && (
              <>
                <CommandSeparator />
                {result.users.length > 0 && (
                  <CommandGroup heading={t("control.search.users")}>
                    {result.users.map((u) => (
                      <CommandItem
                        key={u.id}
                        value={`user ${u.username} ${u.tag}`}
                        onSelect={() => go(`/control/users/${u.id}`)}
                      >
                        <Users className="me-2 size-4" />
                        <span className="flex-1">
                          {u.username}
                          <span className="text-stone-500">#{u.tag}</span>
                        </span>
                        {u.banned_at && (
                          <span className="text-[10px] font-semibold text-red-400">
                            {t("control.search.banned")}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {result.hubs.length > 0 && (
                  <CommandGroup heading={t("control.search.hubs")}>
                    {result.hubs.map((h) => (
                      <CommandItem
                        key={h.id}
                        value={`hub ${h.name} ${h.slug}`}
                        onSelect={() => go(`/control/communities/${h.id}`)}
                      >
                        <Building2 className="me-2 size-4" />
                        <span className="flex-1">{h.name}</span>
                        <span className="text-[10px] text-muted-foreground">{h.slug}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {result.games.length > 0 && (
                  <CommandGroup heading={t("control.search.games")}>
                    {result.games.map((g) => (
                      <CommandItem
                        key={g.id}
                        value={`game ${g.name} ${g.id}`}
                        onSelect={() => go(`/control/games/${g.id}`)}
                      >
                        <Gamepad2 className="me-2 size-4" />
                        <span className="flex-1">{g.name}</span>
                        <span className="text-[10px] text-muted-foreground">{g.short}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
