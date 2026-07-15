import { describe, expect, it } from "vitest";
import { hubMatchesQuery } from "@/lib/hub-search";
import type { HubCard } from "@/lib/mock-data";

const base: HubCard = {
  id: "valorant-sa",
  gameId: "valorant",
  name: "Valorant",
  short: "VAL",
  hubName: "مراكز فالورانت جدة",
  tint: "bg-red-500/20",
  textTint: "text-red-300",
  activeCount: "10",
  category: "shooter",
  members: 100,
};

describe("hubMatchesQuery", () => {
  it("matches display fields with Arabic fold", () => {
    expect(hubMatchesQuery(base, "فالورانت")).toBe(true);
    expect(hubMatchesQuery(base, "جدة")).toBe(true);
  });

  it("matches name_search_norm column", () => {
    const card: HubCard = {
      ...base,
      hubName: "Hub",
      nameSearchNorm: "مراكز فالورانت جده",
      gameNameSearchNorm: "valorant",
    };
    expect(hubMatchesQuery(card, "جده")).toBe(true);
    expect(hubMatchesQuery(card, "فالورانت")).toBe(true);
  });

  it("rejects unrelated", () => {
    expect(hubMatchesQuery(base, "فيفا")).toBe(false);
  });
});
