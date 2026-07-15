import { Capacitor } from "@capacitor/core";

/** Custom scheme registered in Info.plist + Supabase redirect allow-list. */
export const NATIVE_AUTH_REDIRECT = "com.lilnetro0.nexus://auth/callback";

export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
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

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#0c0a09" });
    // Draw under status bar; CSS pt-safe / html padding handles insets
    await StatusBar.setOverlaysWebView({ overlay: true });
  } catch {
    // Optional on web / missing plugin
  }

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch {
    // Optional
  }
}
