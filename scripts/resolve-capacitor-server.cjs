/**
 * Shared Cap remote-server resolution for prepare / inject / config checks.
 */
function resolveCapacitorServerUrl() {
  return String(
    process.env.CAPACITOR_SERVER_URL || process.env.SITE_URL || "",
  ).replace(/\/$/, "");
}

function assertRemoteServerUrl(url) {
  if (!url) {
    console.error(
      "CAPACITOR_SERVER_URL (or SITE_URL) is empty.\n" +
        "Remote Cap builds need https://your-deployed-nexus origin.\n" +
        "See docs/CAPACITOR.md.",
    );
    process.exit(1);
  }
  if (!/^https:\/\//i.test(url)) {
    console.error("CAPACITOR_SERVER_URL must be an https:// URL. Got:", url);
    process.exit(1);
  }
  try {
    // eslint-disable-next-line no-new
    new URL(url);
  } catch {
    console.error("CAPACITOR_SERVER_URL is not a valid URL:", url);
    process.exit(1);
  }
}

function hostFromMaybeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  try {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(withProto).hostname;
  } catch {
    return null;
  }
}

/** Deploy host + www twin + optional Supabase project host for WebView navigations. */
function allowNavigationHosts(url) {
  const hosts = new Set();
  try {
    const u = new URL(url);
    hosts.add(u.hostname);
    if (u.hostname.startsWith("www.")) hosts.add(u.hostname.slice(4));
    else hosts.add(`www.${u.hostname}`);
  } catch {
    /* ignore */
  }

  for (const envKey of ["VITE_SUPABASE_URL", "SUPABASE_URL"]) {
    const h = hostFromMaybeUrl(process.env[envKey]);
    if (h) hosts.add(h);
  }

  return Array.from(hosts);
}

module.exports = {
  resolveCapacitorServerUrl,
  assertRemoteServerUrl,
  allowNavigationHosts,
  hostFromMaybeUrl,
};
