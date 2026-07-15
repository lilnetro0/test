import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Nexus is a TanStack Start (SSR) app. Local `www/` alone cannot run
 * createServerFn — TestFlight uses CAPACITOR_SERVER_URL (remote HTTPS shell).
 * See docs/CAPACITOR.md for dual-mode (remote vs local).
 */
const serverUrl = (
  process.env.CAPACITOR_SERVER_URL ||
  process.env.SITE_URL ||
  ""
).replace(/\/$/, "");

function hostFromMaybeUrl(value: string | undefined): string | null {
  const raw = (value || "").trim();
  if (!raw) return null;
  try {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(withProto).hostname;
  } catch {
    return null;
  }
}

function allowNavigationHosts(url: string): string[] {
  const hosts = new Set<string>();
  try {
    const u = new URL(url);
    hosts.add(u.hostname);
    if (u.hostname.startsWith("www.")) hosts.add(u.hostname.slice(4));
    else hosts.add(`www.${u.hostname}`);
  } catch {
    return [];
  }
  for (const key of ["VITE_SUPABASE_URL", "SUPABASE_URL"] as const) {
    const h = hostFromMaybeUrl(process.env[key]);
    if (h) hosts.add(h);
  }
  return Array.from(hosts);
}

const config: CapacitorConfig = {
  appId: "com.lilnetro0.nexus",
  appName: "Nexus",
  webDir: "www",
  server: {
    androidScheme: "https",
    iosScheme: "https",
    ...(serverUrl
      ? {
          url: serverUrl,
          cleartext: false,
          allowNavigation: allowNavigationHosts(serverUrl),
        }
      : {}),
  },
  ios: {
    // CSS env(safe-area-inset-*) handles notch / home indicator (see styles.css)
    contentInset: "never",
    preferredContentMode: "mobile",
    scheme: "Nexus",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#0c0a09",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0c0a09",
    },
    Keyboard: {
      resize: "body",
      style: "DARK",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
