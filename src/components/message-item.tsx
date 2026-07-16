import { useState, useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/mock-data";
import { EmojiPicker } from "./emoji-picker";
import { Reply, MoreHorizontal, Pin, SmilePlus, Trash2, File as FileIcon, Flag, Pencil } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ConfirmSheet } from "@/components/ui-native";
import { resolveAttachmentUrl } from "@/lib/supabase/storage";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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
  onPin?: (m: ChatMessage, pinned: boolean) => void | Promise<void>;
  onReport?: (m: ChatMessage) => void | Promise<void>;
  onDelete?: (m: ChatMessage) => void | Promise<void>;
  onEdit?: (m: ChatMessage, body: string) => void | Promise<void>;
  onReact?: (m: ChatMessage, emoji: string) => void | Promise<void>;
}) {
  const { t } = useT();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(msg.body);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const longPressRef = useRef<number | null>(null);
  const reactions = msg.reactions ?? [];

  const react = (emoji: string) => {
    if (onReact) void onReact(msg, emoji);
  };

  const clearLongPress = () => {
    if (longPressRef.current != null) {
      window.clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  const startLongPress = () => {
    clearLongPress();
    longPressRef.current = window.setTimeout(() => {
      setActionsOpen(true);
      longPressRef.current = null;
    }, 420);
  };

  useEffect(() => () => clearLongPress(), []);

  if (msg.system) {
    return (
      <div className="flex gap-3 opacity-60">
        <div className="size-9 shrink-0 rounded-xl bg-stone-800" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-baseline gap-2">
            <span className="text-sm font-medium text-stone-400" dir="auto">
              {msg.author}
            </span>
            <span className="nx-caption">{t("msg.system")}</span>
          </div>
          <p className="text-sm italic text-stone-500" dir="auto">
            {msg.body}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="group relative flex gap-3 rounded-lg px-1 py-1 -mx-1"
        onPointerDown={startLongPress}
        onPointerUp={clearLongPress}
        onPointerLeave={clearLongPress}
        onPointerCancel={clearLongPress}
        onContextMenu={(e) => {
          e.preventDefault();
          setActionsOpen(true);
        }}
      >
        <div className={`size-9 shrink-0 rounded-xl ${msg.tint ?? "bg-stone-800"}`} />
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
          <div className="mb-0.5 flex items-baseline gap-2">
            <span className="text-sm font-medium text-white" dir="auto">
              {msg.author}
            </span>
            <span className="nx-caption">{msg.time}</span>
            {msg.pinned && <Pin className="size-3 text-accent" />}
            {msg.edited && <span className="nx-caption">{t("msg.edited")}</span>}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setActionsOpen(true)}
              className="ms-auto grid size-8 place-items-center rounded-lg text-stone-500 hover:bg-white/5 hover:text-white"
              aria-label={t("msg.more")}
            >
              <MoreHorizontal className="size-4" />
            </button>
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
                className="min-h-11 w-full rounded-md border border-border-subtle bg-background px-3 py-2 text-sm text-white outline-none focus:border-accent/50"
                autoFocus
                dir="auto"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-md bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground"
                >
                  {t("msg.save")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(msg.body);
                    setEditing(false);
                  }}
                  className="rounded-md px-3 py-2 text-xs text-stone-400 hover:text-white"
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
          {msg.attachment && <AttachmentBlock attachment={msg.attachment} />}
          {reactions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {reactions.map((r) => (
                <button
                  key={r.emoji}
                  type="button"
                  onClick={() => react(r.emoji)}
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
                    r.mine
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-border-subtle bg-white/[0.03] text-stone-300 hover:bg-white/5",
                  )}
                >
                  <span>{r.emoji}</span>
                  <span className="font-mono text-[10px]">{r.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Sheet open={actionsOpen} onOpenChange={setActionsOpen}>
        <SheetContent
          side="bottom"
          className="bottom-[var(--dock-clearance)] rounded-t-2xl border-border-subtle bg-surface-mid p-0"
        >
          <SheetHeader className="border-b border-border-subtle px-4 py-3 text-start">
            <SheetTitle className="nx-title">{t("msg.actions")}</SheetTitle>
          </SheetHeader>
          <div className="space-y-0.5 p-2">
            <EmojiPicker
              onPick={(emoji) => {
                react(emoji);
                setActionsOpen(false);
              }}
              trigger={
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-stone-200 hover:bg-white/5"
                >
                  <SmilePlus className="size-4" />
                  {t("msg.react")}
                </button>
              }
            />
            {onReply ? (
              <ActionRow
                icon={<Reply className="size-4" />}
                label={t("msg.reply")}
                onClick={() => {
                  onReply(msg);
                  setActionsOpen(false);
                }}
              />
            ) : null}
            {onPin ? (
              <ActionRow
                icon={<Pin className="size-4" />}
                label={msg.pinned ? t("msg.unpin") : t("msg.pin")}
                onClick={() => {
                  void onPin(msg, !msg.pinned);
                  setActionsOpen(false);
                }}
              />
            ) : null}
            {onEdit ? (
              <ActionRow
                icon={<Pencil className="size-4" />}
                label={t("msg.edit")}
                onClick={() => {
                  setDraft(msg.body);
                  setEditing(true);
                  setActionsOpen(false);
                }}
              />
            ) : null}
            {onReport ? (
              <ActionRow
                icon={<Flag className="size-4" />}
                label={t("msg.report")}
                onClick={() => {
                  void onReport(msg);
                  setActionsOpen(false);
                }}
              />
            ) : null}
            {onDelete ? (
              <ActionRow
                icon={<Trash2 className="size-4" />}
                label={t("msg.delete")}
                danger
                onClick={() => {
                  setActionsOpen(false);
                  setConfirmDelete(true);
                }}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmSheet
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("msg.delete")}
        description={t("msg.deleteConfirm")}
        destructive
        confirmLabel={t("msg.delete")}
        onConfirm={async () => {
          if (onDelete) await onDelete(msg);
          setConfirmDelete(false);
        }}
      />
    </>
  );
}

function ActionRow({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold hover:bg-white/5",
        danger ? "text-danger" : "text-stone-200",
      )}
    >
      {icon}
      {label}
    </button>
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
        {attachment.meta && <p className="nx-caption">{attachment.meta}</p>}
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
