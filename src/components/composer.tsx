import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { Plus, Send, AtSign, Paperclip, Gift, X } from "lucide-react";
import { EmojiPicker } from "./emoji-picker";
import { HUBS, ME, type MemberInfo } from "@/lib/mock-data";
import { toast } from "sonner";
import { useT, type TKey } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-provider";
import { shouldUseMockData } from "@/lib/supabase/env";
import { uploadAttachment, ATTACHMENT_ACCEPT, ATTACHMENT_MAX_BYTES } from "@/lib/supabase/storage";
import {
  assertFileSize,
  ATTACHMENT_MIME_TYPES,
  resolveAllowedMime,
} from "@/lib/supabase/storage-policy";

export type ComposerHandle = { focus: () => void };

export type ComposerAttachment = { url: string; name: string; mime: string };

const LFG_TEMPLATE_KEYS: TKey[] = [
  "composer.lfg.tpl.ranked",
  "composer.lfg.tpl.casual",
  "composer.lfg.tpl.open",
];

export const Composer = forwardRef<
  ComposerHandle,
  {
    channelName: string;
    gameId?: string;
    /** AF11 — show LFG post templates above the input */
    lfgMode?: boolean;
    mentionMembers?: MemberInfo[];
    replyTo?: { id?: string; author: string; body: string };
    onCancelReply?: () => void;
    onTyping?: () => void;
    typingLabel?: string | null;
    onSend?: (
      body: string,
      replyToId?: string,
      attachment?: ComposerAttachment,
    ) => Promise<{ ok: boolean; error?: string } | void> | { ok: boolean; error?: string } | void;
  }
>(function Composer(
  {
    channelName,
    gameId,
    lfgMode,
    mentionMembers,
    replyTo,
    onCancelReply,
    onTyping,
    typingLabel,
    onSend,
  },
  ref,
) {
  const [value, setValue] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { t } = useT();
  const { user } = useAuth();
  const live = !shouldUseMockData();

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  useEffect(() => {
    const onFocus = () => inputRef.current?.focus();
    window.addEventListener("nexus:focus-composer", onFocus);
    return () => window.removeEventListener("nexus:focus-composer", onFocus);
  }, []);

  const members =
    mentionMembers ?? (gameId ? (HUBS[gameId]?.members.online ?? []) : []);
  const mentionMatches =
    mentionQuery !== null
      ? members.filter((m) => m.name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 5)
      : [];

  const onChange = (v: string) => {
    setValue(v);
    const match = v.match(/@([A-Za-z0-9_]*)$/);
    setMentionQuery(match ? match[1] : null);
    if (v.trim()) onTyping?.();
  };

  const insertMention = (name: string, tag?: string) => {
    const tagPart = tag ? (tag.startsWith("#") ? tag : `#${tag}`) : "";
    setValue((v) => v.replace(/@([A-Za-z0-9_]*)(?:#\d{0,4})?$/, `@${name}${tagPart} `));
    setMentionQuery(null);
    inputRef.current?.focus();
  };

  const pickFile = () => {
    if (!live) {
      toast(t("composer.attachDemo"));
      return;
    }
    fileRef.current?.click();
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = value.trim();
    if ((!body && !pendingFile) || sending) return;

    if (!onSend) {
      toast(`Sent as ${ME.name}`, { description: body.slice(0, 60) });
      setValue("");
      setPendingFile(null);
      onCancelReply?.();
      return;
    }

    setSending(true);
    try {
      let attachment: ComposerAttachment | undefined;
      if (pendingFile && live && user) {
        setUploading(true);
        const up = await uploadAttachment(user.id, pendingFile);
        setUploading(false);
        if (up.error || !up.url) {
          toast.error(up.error ?? t("msg.err.upload"));
          return;
        }
        attachment = { url: up.url, name: up.name ?? pendingFile.name, mime: up.mime ?? pendingFile.type };
      }

      const result = await onSend(body, replyTo?.id, attachment);
      if (result && "ok" in result && !result.ok) return;
      setValue("");
      setPendingFile(null);
      onCancelReply?.();
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const placeholder = lfgMode
    ? t("composer.placeholderLfg").replace("#{channel}", channelName)
    : t("composer.placeholder").replace("#{channel}", channelName);
  const canSend = Boolean(value.trim() || pendingFile) && !sending && !uploading;

  return (
    <div className="shrink-0 border-t border-border-subtle/60 bg-background/40 p-2.5 md:p-6">
      <input
        ref={fileRef}
        type="file"
        accept={ATTACHMENT_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          e.target.value = "";
          if (!f) return;
          const sizeErr = assertFileSize(f.size, ATTACHMENT_MAX_BYTES);
          if (sizeErr) {
            toast.error(sizeErr);
            return;
          }
          const mimeResult = resolveAllowedMime(f, ATTACHMENT_MIME_TYPES);
          if ("error" in mimeResult) {
            toast.error(mimeResult.error);
            return;
          }
          setPendingFile(f);
        }}
      />
      {lfgMode ? (
        <div className="mb-2 space-y-1.5">
          <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-stone-500">
            {t("composer.lfg.hint")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {LFG_TEMPLATE_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setValue(t(key));
                  setMentionQuery(null);
                  inputRef.current?.focus();
                }}
                className="rounded-md border border-border-subtle bg-surface-mid/60 px-2.5 py-1 text-[11px] font-semibold text-stone-300 hover:border-accent/40 hover:text-white"
                dir="auto"
              >
                {t(key)}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-t-lg border border-b-0 border-border-subtle bg-surface-mid/50 px-4 py-2 text-xs">
          <span className="truncate text-stone-400">
            {t("composer.replying")}{" "}
            <span className="font-semibold text-white" dir="auto">
              {replyTo.author}
            </span>
          </span>
          <button
            onClick={onCancelReply}
            className="text-stone-500 hover:text-white"
            aria-label={t("composer.cancelReply")}
          >
            ✕
          </button>
        </div>
      )}
      {pendingFile && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-mid px-3 py-2 text-xs text-stone-300">
          <Paperclip className="size-3.5 text-accent" />
          <span className="min-w-0 flex-1 truncate" dir="auto">
            {pendingFile.name}
          </span>
          <button
            type="button"
            onClick={() => setPendingFile(null)}
            className="text-stone-500 hover:text-white"
            aria-label={t("common.close")}
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
      {typingLabel ? (
        <p className="mb-1 truncate px-1 text-[11px] text-stone-500" aria-live="polite" dir="auto">
          {typingLabel}
        </p>
      ) : null}
      {mentionMatches.length > 0 && (
        <div className="mb-2 overflow-hidden rounded-lg border border-border-subtle bg-surface-mid">
          <div className="border-b border-border-subtle px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-500">
            {t("composer.mentions")} "{mentionQuery}"
          </div>
          {mentionMatches.map((m) => (
            <button
              key={`${m.name}-${m.tag}`}
              onClick={() => insertMention(m.name, m.tag)}
              className="flex w-full items-center gap-3 px-3 py-2 text-start transition-colors hover:bg-white/5"
            >
              <div className="size-6 rounded-full bg-stone-800" />
              <span className="text-sm text-stone-200" dir="auto">
                {m.name}
              </span>
              <span className="font-mono text-[10px] text-stone-500 ms-auto">{m.tag}</span>
            </button>
          ))}
          <p className="border-t border-border-subtle px-3 py-1.5 text-[10px] text-stone-600">
            {t("composer.mentionHint")}
          </p>
        </div>
      )}
      <form
        onSubmit={send}
        className={`group relative flex items-center border border-border-subtle bg-surface-mid transition-colors focus-within:border-accent/50 ${
          replyTo ? "rounded-b-xl rounded-t-none border-t-border-subtle/50" : "rounded-xl"
        }`}
      >
        <button
          type="button"
          onClick={pickFile}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-stone-500 hover:text-white ms-2"
          aria-label={t("composer.attach")}
        >
          <Plus className="size-4" />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          dir="auto"
          className="min-w-0 flex-1 bg-transparent px-2 py-4 text-sm text-white outline-none placeholder:text-stone-600"
        />
        <div className="flex shrink-0 items-center gap-0.5 text-stone-500 me-1">
          <button
            type="button"
            onClick={pickFile}
            className="grid size-8 place-items-center rounded-lg hover:text-white"
            aria-label={t("composer.upload")}
          >
            <Paperclip className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => toast(t("composer.gifSoon"))}
            title={`${t("composer.gif")} · ${t("common.soon")}`}
            className="grid size-7 place-items-center rounded-md text-stone-700 opacity-50 hover:opacity-80 hover:text-stone-500"
            aria-label={`${t("composer.gif")} — ${t("common.comingSoon")}`}
          >
            <Gift className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setValue((v) => v + "@");
              inputRef.current?.focus();
            }}
            className="grid size-8 place-items-center rounded-lg hover:text-white"
            aria-label={t("composer.mention")}
          >
            <AtSign className="size-4" />
          </button>
          <EmojiPicker onPick={(e) => setValue((v) => v + e)} />
        </div>
        <button
          type="submit"
          className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent transition-colors hover:bg-accent/20 disabled:opacity-40 me-2"
          aria-label={t("composer.send")}
          disabled={!canSend}
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
});
