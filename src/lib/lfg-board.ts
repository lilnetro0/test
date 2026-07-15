/**
 * Thin LFG board helpers (AF19) — open posts from #lfg channel messages.
 * No events table: age-capped root messages with meaningful body text.
 */
import type { ChatMessage } from "@/lib/mock-data";

const DEFAULT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LIMIT = 12;
const MIN_BODY = 8;

export function selectLfgBoardPosts(
  messages: ChatMessage[],
  opts?: { maxAgeMs?: number; limit?: number; now?: number },
): ChatMessage[] {
  const maxAgeMs = opts?.maxAgeMs ?? DEFAULT_MAX_AGE_MS;
  const limit = opts?.limit ?? DEFAULT_LIMIT;
  const now = opts?.now ?? Date.now();

  const sorted = [...messages].sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta;
  });

  const out: ChatMessage[] = [];
  for (const m of sorted) {
    if (m.system) continue;
    if (m.replyTo || m.replyToId) continue;
    const body = (m.body ?? "").trim();
    if (body.length < MIN_BODY) continue;
    if (m.createdAt) {
      const t = Date.parse(m.createdAt);
      if (Number.isFinite(t) && now - t > maxAgeMs) continue;
    }
    out.push(m);
    if (out.length >= limit) break;
  }
  return out;
}
