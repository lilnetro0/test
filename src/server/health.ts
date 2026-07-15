import { createServerFn } from "@tanstack/react-start";
import { collectAppHealth } from "@/lib/ops/health";

/** Admin / Settings — aggregated Supabase + LiveKit health (no secrets). */
export const getAppHealth = createServerFn({ method: "GET" }).handler(async () => {
  return collectAppHealth();
});
