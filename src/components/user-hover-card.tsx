import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import type { MemberInfo } from "@/lib/mock-data";
import { MessageSquare, UserPlus } from "lucide-react";
import { useT } from "@/lib/i18n";

export function UserHoverCard({
  member,
  children,
}: {
  member: MemberInfo;
  children: React.ReactNode;
}) {
  const { t } = useT();
  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side="left"
        align="start"
        className="w-72 overflow-hidden border-border-subtle/80 bg-surface-mid p-0 text-foreground shadow-[var(--nx-shadow-3)]"
      >
        <div className="h-14 bg-gradient-to-r from-accent/18 to-transparent" />
        <div className="-mt-7 px-4 pb-4">
          <div className="mb-3 size-14 rounded-2xl border-[3px] border-surface-mid bg-stone-800 shadow-[var(--nx-shadow-1)]" />
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <p className="nx-label text-base text-white">{member.name}</p>
              {member.role && (
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                    member.role === "admin"
                      ? "bg-accent/12 text-accent"
                      : "bg-white/5 text-stone-400"
                  }`}
                >
                  {member.role}
                </span>
              )}
            </div>
            <p className="nx-caption font-mono">{member.tag ?? "#0000"}</p>
          </div>
          <div className="mb-3 rounded-xl border border-border-subtle/70 bg-background/40 p-3 shadow-[var(--nx-shadow-1)]">
            <p className="nx-section mb-1">
              {member.inVoice ? t("hover.inVoice") : t("hover.status")}
            </p>
            <p className="nx-body text-stone-300">
              {member.inVoice ?? member.status ?? t("hover.available")}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="nx-press flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent/12 px-3 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent/18"
            >
              <MessageSquare className="size-3.5" /> {t("profile.message")}
            </button>
            <button
              type="button"
              className="nx-touch grid place-items-center rounded-lg bg-white/5 text-stone-400 hover:text-white"
              aria-label={t("profile.add")}
            >
              <UserPlus className="size-4" />
            </button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
