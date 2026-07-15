import { useState, useEffect } from "react";
import type { ChatMessage } from "@/lib/mock-data";
import { EmojiPicker } from "./emoji-picker";
import { Reply, MoreHorizontal, Pin, SmilePlus, Trash2, File as FileIcon, Flag, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { resolveAttachmentUrl } from "@/lib/supabase/storage";
import { useT } from "@/lib/i18n";

export function MessageItem({
  msg,
  onReply,
  onPin,
  onReport,
  onDelete,
  onEdit,
  onReact,
}: {
  msg: ChatMessage;
  onReply?: (m: ChatMessage) => void;
  /** When omitted, pin action is hidden. */
  onPin?: (m: ChatMessage, pinned: boolean) => void | Promise<void>;
  onReport?: (m: ChatMessage) => void | Promise<void>;
  onDelete?: (m: ChatMessage) => void | Promise<void>;
  onEdit?: (m: ChatMessage, body: string) => void | Promise<void>;
  onReact?: (m: ChatMessage, emoji: string) => void | Promise<void>;
}) {
  const { t } = useT();
  const isMobile = useIsMobile();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(msg.body);
  const reactions = msg.reactions ?? [];

  const react = (emoji: string) => {
    if (onReact) void onReact(msg, emoji);
  };

  if (msg.system) {
    return (
      <div className="flex gap-4 opacity-60">
        <div className="size-10 shrink-0 rounded-xl bg-stone-800" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-baseline gap-2">
            <span className="text-sm font-bold text-stone-400" dir="auto">
              {msg.author}
            </span>
            <span className="text-[10px] font-medium uppercase text-stone-600">{t("msg.system")}</span>
          </div>
          <p className="text-sm italic text-stone-500" dir="auto">
            {msg.body}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex gap-4">
      <div className={`size-10 shrink-0 rounded-xl ${msg.tint ?? "bg-stone-800"}`} />
      <div className="min-w-0 flex-1">
        {msg.replyTo && (
          <div className="mb-1 flex items-center gap-2 text-xs text-stone-500">
            <Reply className="size-3 shrink-0" />
            <span className="font-semibold text-stone-400" dir="auto">
              {msg.replyTo.author}
            </span>
            <span className="truncate" dir="auto">
              {msg.replyTo.body}
            </span>
          </div>
        )}
        <div className="mb-1 flex items-baseline gap-2">
          <span className="text-sm font-bold text-white" dir="auto">
            {msg.author}
          </span>
          <span className="text-[10px] text-stone-600">{msg.time}</span>
          {msg.pinned && <Pin className="size-3 text-accent" />}
          {msg.edited && <span className="text-[10px] text-stone-600">{t("msg.edited")}</span>}
        </div>
        {editing ? (
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const next = draft.trim();
              if (!next || !onEdit) return;
              void Promise.resolve(onEdit(msg, next)).then(() => setEditing(false));
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full rounded-md border border-border-subtle bg-background px-3 py-2 text-sm text-white outline-none focus:border-accent/50"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-md bg-accent px-3 py-1 text-xs font-bold uppercase text-accent-foreground"
              >
                {t("msg.save")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft(msg.body);
                  setEditing(false);
                }}
                className="rounded-md px-3 py-1 text-xs text-stone-400 hover:text-white"
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-pretty text-sm leading-relaxed text-stone-300" dir="auto">
            {msg.body.trim() ? highlightMentions(msg.body) : null}
          </p>
        )}
        {msg.attachment && (
          <AttachmentBlock attachment={msg.attachment} />
        )}
        {reactions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => react(r.emoji)}
                className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
                  r.mine
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-border-subtle bg-white/[0.03] text-stone-300 hover:bg-white/5"
                }`}
              >
                <span>{r.emoji}</span>
                <span className="font-mono text-[10px]">{r.count}</span>
              </button>
            ))}
            <EmojiPicker
              onPick={react}
              trigger={
                <button
                  className={`grid size-6 place-items-center rounded-full border border-border-subtle bg-white/[0.03] text-stone-400 transition-opacity hover:text-white ${
                    isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                  aria-label={t("msg.react")}
                >
                  <SmilePlus className="size-3" />
                </button>
              }
            />
          </div>
        )}
      </div>

      <div
        className={`absolute -top-3 end-4 items-center gap-0.5 rounded-md border border-border-subtle bg-surface-mid p-0.5 shadow-lg ${
          isMobile ? "flex" : "hidden group-hover:flex"
        }`}
      >
        <EmojiPicker
          onPick={react}
          trigger={
            <button
              className="grid size-7 place-items-center rounded text-stone-400 hover:bg-white/5 hover:text-white"
              aria-label={t("msg.react")}
            >
              <SmilePlus className="size-3.5" />
            </button>
          }
        />
        <button
          onClick={() => onReply?.(msg)}
          className="grid size-7 place-items-center rounded text-stone-400 hover:bg-white/5 hover:text-white"
          aria-label={t("msg.reply")}
        >
          <Reply className="size-3.5" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="grid size-7 place-items-center rounded text-stone-400 hover:bg-white/5 hover:text-white"
              aria-label={t("msg.more")}
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-border-subtle bg-surface-mid">
            {onPin ? (
              <DropdownMenuItem
                onClick={() => {
                  const next = !msg.pinned;
                  void onPin(msg, next);
                }}
              >
                <Pin className="me-2 size-3.5" /> {msg.pinned ? t("msg.unpin") : t("msg.pin")}
              </DropdownMenuItem>
            ) : null}
            {onEdit ? (
              <DropdownMenuItem
                onClick={() => {
                  setDraft(msg.body);
                  setEditing(true);
                }}
              >
                <Pencil className="me-2 size-3.5" /> {t("msg.edit")}
              </DropdownMenuItem>
            ) : null}
            {onReport ? (
              <DropdownMenuItem
                onClick={() => {
                  void onReport(msg);
                }}
              >
                <Flag className="me-2 size-3.5" /> {t("msg.report")}
              </DropdownMenuItem>
            ) : null}
            {onDelete ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-danger focus:text-danger"
                  onClick={() => {
                    void onDelete(msg);
                  }}
                >
                  <Trash2 className="me-2 size-3.5" /> {t("msg.delete")}
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function AttachmentBlock({
  attachment,
}: {
  attachment: NonNullable<ChatMessage["attachment"]>;
}) {
  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void resolveAttachmentUrl(attachment.url).then((resolved) => {
      if (!cancelled) setUrl(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [attachment.url]);

  if (attachment.kind === "image") {
    const src = url ?? attachment.url;
    if (!src) return null;
    return (
      <a href={src} target="_blank" rel="noreferrer" className="mt-2 block max-w-sm">
        <img
          src={src}
          alt={attachment.name}
          className="max-h-64 rounded-lg border border-border-subtle object-contain"
        />
      </a>
    );
  }

  const href = url ?? attachment.url;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mt-2 flex max-w-sm items-center gap-3 rounded-lg border border-border-subtle bg-background/50 p-3 hover:border-accent/40"
    >
      <div className="grid size-10 shrink-0 place-items-center rounded-md bg-accent/10 text-accent">
        <FileIcon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-white">{attachment.name}</p>
        {attachment.meta && (
          <p className="text-[10px] text-stone-500">{attachment.meta}</p>
        )}
      </div>
    </a>
  );
}

function highlightMentions(body: string): React.ReactNode {
  const parts = body.split(/(@[A-Za-z0-9_]+#\d{4}|@[A-Za-z0-9_]+)/g);
  return parts.map((p, i) =>
    p.startsWith("@") ? (
      <span key={i} className="rounded bg-accent/15 px-1 font-semibold text-accent">
        {p}
      </span>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}
