import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Users } from "lucide-react";
import type { ChatMessage } from "@/lib/mock-data";
import { selectLfgBoardPosts } from "@/lib/lfg-board";
import { useT } from "@/lib/i18n";

export function LfgBoard({
  messages,
  onReply,
}: {
  messages: ChatMessage[];
  onReply?: (msg: ChatMessage) => void;
}) {
  const { t } = useT();
  const [collapsed, setCollapsed] = useState(false);
  const posts = useMemo(() => selectLfgBoardPosts(messages), [messages]);

  return (
    <section
      className="border-b border-border-subtle bg-accent/5"
      aria-label={t("home.lfgBoard.title")}
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center gap-2 px-4 py-2 text-start md:px-6"
      >
        <Users className="size-3.5 shrink-0 text-accent" />
        <span className="min-w-0 flex-1 truncate text-[11px] font-bold uppercase tracking-widest text-accent">
          {t("home.lfgBoard.title")}
          <span className="ms-2 font-mono text-stone-500 normal-case tracking-normal">
            {posts.length}
          </span>
        </span>
        {collapsed ? (
          <ChevronDown className="size-3.5 text-stone-500" />
        ) : (
          <ChevronUp className="size-3.5 text-stone-500" />
        )}
      </button>

      {!collapsed ? (
        posts.length === 0 ? (
          <p className="px-4 pb-3 text-xs text-stone-500 md:px-6" dir="auto">
            {t("home.lfgBoard.empty")}
          </p>
        ) : (
          <ul className="flex gap-2 overflow-x-auto px-4 pb-3 md:px-6">
            {posts.map((p) => (
              <li
                key={p.id}
                className="w-[min(100%,16rem)] shrink-0 rounded-xl border border-border-subtle bg-surface-mid/80 p-3"
              >
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-xs font-bold text-white" dir="auto">
                    {p.author}
                  </span>
                  <span className="ms-auto shrink-0 text-[10px] text-stone-500">{p.time}</span>
                </div>
                <p className="mt-1 line-clamp-3 text-sm text-stone-300" dir="auto">
                  {p.body}
                </p>
                {onReply ? (
                  <button
                    type="button"
                    onClick={() => onReply(p)}
                    className="mt-2 text-[10px] font-bold uppercase tracking-wide text-accent hover:underline"
                  >
                    {t("home.lfgBoard.reply")}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )
      ) : null}
    </section>
  );
}
