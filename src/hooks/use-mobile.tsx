import * as React from "react";

/** Matches Tailwind `md` — keep dock brand lift / VoiceDock compact aligned (Phase 14). */
export const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // Assume phone until measured so hover-only chrome does not flash on first paint.
  const [isMobile, setIsMobile] = React.useState(true);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    onChange();
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
