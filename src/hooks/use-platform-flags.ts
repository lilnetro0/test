import { useEffect, useState } from "react";
import {
  defaultPlatformFlags,
  fetchPlatformNoticesCached,
  type PublicPlatformFlags,
} from "@/lib/control/public";
import { shouldUseMockData } from "@/lib/supabase/env";

/**
 * Consumer-facing Control feature flags (session-cached).
 * Defaults match CONTROL_FLAG_CATALOG until the public fetch resolves.
 */
export function usePlatformFlags(): PublicPlatformFlags {
  const [flags, setFlags] = useState<PublicPlatformFlags>(defaultPlatformFlags);

  useEffect(() => {
    if (shouldUseMockData()) return;
    let cancelled = false;
    void fetchPlatformNoticesCached().then((n) => {
      if (!cancelled) setFlags(n.flags);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return flags;
}
