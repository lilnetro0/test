import { createServerFn } from "@tanstack/react-start";
import { collectAppHealth } from "@/lib/ops/health";

/** Admin — aggregated Supabase + LiveKit health (no secrets). Client-safe createServerFn path (not under src/server/). */
export const getAppHealth = createServerFn({ method: "GET" }).handler(async () => {
  return collectAppHealth();
});
