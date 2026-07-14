import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import type { MemberInfo } from "@/lib/mock-data";
import { MessageSquare, UserPlus } from "lucide-react";

export function UserHoverCard({
  member,
  children,
}: {
  member: MemberInfo;
  children: React.ReactNode;
}) {
  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side="left"
        align="start"
        className="w-72 overflow-hidden border-border-subtle bg-surface-mid p-0 text-foreground"
      >
        <div className="h-16 bg-gradient-to-r from-accent/25 to-purple-500/20" />
        <div className="-mt-8 px-4 pb-4">
          <div className="mb-3 size-14 rounded-2xl border-4 border-surface-mid bg-stone-800" />
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-white">{member.name}</p>
              {member.role && (
                <span
                  className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                    member.role === "admin"
                      ? "bg-accent/15 text-accent"
                      : "bg-white/5 text-stone-400"
                  }`}
                >
                  {member.role}
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono text-stone-500">{member.tag ?? "#0000"}</p>
          </div>
          <div className="mb-3 rounded-lg border border-border-subtle bg-background/50 p-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-stone-500">
              {member.inVoice ? "In voice" : "Status"}
            </p>
            <p className="text-xs text-stone-300">
              {member.inVoice ?? member.status ?? "Available"}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/20">
              <MessageSquare className="size-3.5" /> Message
            </button>
            <button
              className="grid size-9 place-items-center rounded-md bg-white/5 text-stone-400 hover:text-white"
              aria-label="Add friend"
            >
              <UserPlus className="size-4" />
            </button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
