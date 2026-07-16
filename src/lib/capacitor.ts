import { Capacitor } from "@capacitor/core";
import { MOBILE_BREAKPOINT } from "@/hooks/use-mobile";

/** Custom scheme registered in Info.plist + Supabase redirect allow-list. */
export const NATIVE_AUTH_REDIRECT = "com.lilnetro0.nexus://auth/callback";

/** Default SSR / PWA viewport — user pinch-zoom remains available. */
export const DEFAULT_VIEWPORT =
  "width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content";

/** Capacitor WKWebView — disable double-tap / pinch page zoom in the native shell. */
export const CAPACITOR_VIEWPORT =
  "width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content";

export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/** Touch phones / Capacitor — hide desktop-only UX. Aligned with useIsMobile breakpoint. */
export function isPhoneLikeUi(): boolean {
  if (typeof window === "undefined") return false;
  if (isNativeApp()) return true;
  return window.matchMedia(
    `(max-width: ${MOBILE_BREAKPOINT - 1}px), (pointer: coarse)`,
  ).matches;
}

export function authRedirectTo(path = "/"): string {
  if (typeof window === "undefined") return path;
  if (isNativeApp()) return NATIVE_AUTH_REDIRECT;
  const base = window.location.origin.replace(/\/$/, "");
  if (path.startsWith("http")) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function bootstrapNativeShell(): Promise<void> {
  if (!isNativeApp()) return;

  applyCapacitorViewport();

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#0c0a09" });
    await StatusBar.setOverlaysWebView({ overlay: true });
  } catch {
    // Optional on web / missing plugin
  }

  try {
    const { Keyboard, KeyboardResize, KeyboardStyle } = await import("@capacitor/keyboard");
    await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
    await Keyboard.setStyle({ style: KeyboardStyle.Dark });
    await Keyboard.setScroll({ isDisabled: false });
    await Keyboard.setAccessoryBarVisible({ isVisible: true });
  } catch {
    // Optional until next native sync includes the plugin
  }

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch {
    // Optional
  }
}

/** Native shell: strict viewport + data-capacitor for CSS (idempotent). */
export function applyCapacitorViewport(): void {
  if (!isNativeApp()) return;
  try {
    document.documentElement.dataset.capacitor = "1";
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) meta.setAttribute("content", CAPACITOR_VIEWPORT);
  } catch {
    // SSR / no document
  }
}
