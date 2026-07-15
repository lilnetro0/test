import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EMOJI_CATEGORIES } from "@/lib/mock-data";
import { Smile } from "lucide-react";
import { useT } from "@/lib/i18n";

export function EmojiPicker({ onPick, trigger }: { onPick: (emoji: string) => void; trigger?: React.ReactNode }) {
  const { t } = useT();
  const [activeCat, setActiveCat] = useState(0);
  const [query, setQuery] = useState("");
  const cat = EMOJI_CATEGORIES[activeCat];
  const filtered = query
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis).filter((e) => e.includes(query))
    : cat.emojis;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="grid size-8 place-items-center rounded-lg text-stone-500 hover:text-white"
            aria-label={t("a11y.insertEmoji")}
          >
            <Smile className="size-4" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="w-72 border-border-subtle bg-surface-mid p-0 text-foreground"
      >
        <div className="border-b border-border-subtle p-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("a11y.searchEmoji")}
            className="w-full rounded-md bg-background px-3 py-2 text-xs text-stone-300 placeholder-stone-600 outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div className="grid max-h-56 grid-cols-8 gap-1 overflow-y-auto p-2">
          {filtered.map((e, i) => (
            <button
              key={`${e}-${i}`}
              onClick={() => onPick(e)}
              className="grid size-8 place-items-center rounded-md text-base transition-colors hover:bg-white/5"
            >
              {e}
            </button>
          ))}
        </div>
        {!query && (
          <div className="flex items-center justify-between gap-1 border-t border-border-subtle p-2">
            {EMOJI_CATEGORIES.map((c, i) => (
              <button
                key={c.name}
                onClick={() => setActiveCat(i)}
                title={c.name}
                className={`grid size-8 place-items-center rounded-md transition-colors ${
                  i === activeCat ? "bg-accent/15 text-accent" : "text-stone-500 hover:bg-white/5"
                }`}
              >
                {c.icon}
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
