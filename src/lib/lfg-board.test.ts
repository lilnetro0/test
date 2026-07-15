import { describe, expect, it } from "vitest";
import { selectLfgBoardPosts } from "@/lib/lfg-board";
import type { ChatMessage } from "@/lib/mock-data";

function msg(partial: Partial<ChatMessage> & Pick<ChatMessage, "id" | "body">): ChatMessage {
  return {
    author: "Player",
    time: "1m",
    ...partial,
  };
}

describe("selectLfgBoardPosts", () => {
  const now = Date.parse("2026-07-15T21:00:00.000Z");

  it("keeps recent root posts with enough body", () => {
    const posts = selectLfgBoardPosts(
      [
        msg({
          id: "1",
          body: "LFG ranked — need 1",
          createdAt: "2026-07-15T20:30:00.000Z",
        }),
        msg({
          id: "2",
          body: "hi",
          createdAt: "2026-07-15T20:45:00.000Z",
        }),
        msg({
          id: "3",
          body: "reply body long enough",
          replyToId: "1",
          createdAt: "2026-07-15T20:50:00.000Z",
        }),
      ],
      { now },
    );
    expect(posts.map((p) => p.id)).toEqual(["1"]);
  });

  it("drops stale posts", () => {
    const posts = selectLfgBoardPosts(
      [
        msg({
          id: "old",
          body: "Looking for squad yesterday",
          createdAt: "2026-07-14T10:00:00.000Z",
        }),
      ],
      { now, maxAgeMs: 12 * 60 * 60 * 1000 },
    );
    expect(posts).toHaveLength(0);
  });
});
