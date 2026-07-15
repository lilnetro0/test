import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Nexus is a TanStack Start (SSR) app. Local web assets alone cannot run
 * createServerFn. For a usable iOS build, set CAPACITOR_SERVER_URL (or SITE_URL)
 * to your deployed HTTPS origin before `npx cap sync` / Codemagic.
 */
const serverUrl = (
  process.env.CAPACITOR_SERVER_URL ||
  process.env.SITE_URL ||
  ""
).replace(/\/$/, "");

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
        }
      : {}),
  },
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
  },
};

export default config;
