/**
 * Build Capacitor webDir (www/).
 *
 * Remote mode (CAPACITOR_SERVER_URL set):
 *   Bridge splash → location.replace(remote). Does NOT copy .output/public
 *   (that would imply a false “bundled SSR” story; createServerFn still needs HTTPS).
 *
 * Local mode (no URL):
 *   Honest offline shell explaining how to set CAPACITOR_SERVER_URL.
 *
 * Set CAPACITOR_REQUIRE_SERVER=1 (Codemagic) to fail if URL is missing.
 */
const fs = require("node:fs");
const path = require("node:path");
const {
  resolveCapacitorServerUrl,
  assertRemoteServerUrl,
  allowNavigationHosts,
} = require("./resolve-capacitor-server.cjs");

const root = process.cwd();
const www = path.join(root, "www");
const requireServer =
  process.env.CAPACITOR_REQUIRE_SERVER === "1" ||
  process.env.CAPACITOR_REQUIRE_SERVER === "true";

const serverUrl = resolveCapacitorServerUrl();
if (requireServer) assertRemoteServerUrl(serverUrl);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

ensureDir(www);

// Wipe previous prepare so we never leave stale .output/public mixed with bridge.
for (const entry of fs.readdirSync(www)) {
  fs.rmSync(path.join(www, entry), { recursive: true, force: true });
}

const hosts = serverUrl ? allowNavigationHosts(serverUrl) : [];

const remoteBody = serverUrl
  ? `<p id="status">Opening Nexus…</p>
<p><a id="continue" href="${escapeHtml(serverUrl)}">Continue</a></p>
<p id="err" hidden style="color:#f87171"></p>
<button id="retry" type="button" hidden style="margin-top:1rem;padding:0.6rem 1rem;border-radius:0.5rem;border:1px solid #44403c;background:#1c1917;color:#fafaf9">Retry</button>
<script>
(function () {
  var url = ${JSON.stringify(serverUrl)};
  var status = document.getElementById("status");
  var err = document.getElementById("err");
  var retry = document.getElementById("retry");
  function fail(msg) {
    status.textContent = "Could not reach Nexus";
    err.hidden = false;
    err.textContent = msg;
    retry.hidden = false;
  }
  function go() {
    status.textContent = "Opening Nexus…";
    err.hidden = true;
    retry.hidden = true;
    var ctrl = new AbortController();
    var t = setTimeout(function () { ctrl.abort(); }, 10000);
    fetch(url, { method: "GET", mode: "cors", credentials: "omit", cache: "no-store", signal: ctrl.signal })
      .then(function () { clearTimeout(t); location.replace(url); })
      .catch(function () {
        clearTimeout(t);
        // CORS/opaque failures still often mean the host is up — try navigate anyway.
        try { location.replace(url); }
        catch (e) { fail("Check your connection, then tap Retry."); }
      });
  }
  retry.addEventListener("click", go);
  go();
})();
</script>`
  : "";

const localBody = `<p>This iOS shell needs your <strong>deployed</strong> Nexus HTTPS origin.</p>
<p>TanStack Start server functions cannot run from local <code>www/</code> alone.</p>
<p>Set <code>CAPACITOR_SERVER_URL=https://…</code>, then <code>npm run cap:sync</code>.</p>
<p style="margin-top:1.25rem;font-size:0.85rem">See <code>docs/CAPACITOR.md</code> in the repo.</p>`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="format-detection" content="telephone=no" />
  <meta name="nexus-cap-mode" content="${serverUrl ? "remote" : "local"}" />
  <title>Nexus</title>
  <style>
    :root { color-scheme: dark; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      font-family: "Segoe UI", system-ui, sans-serif;
      background: #0c0a09;
      color: #fafaf9;
      text-align: center;
      padding: max(2rem, env(safe-area-inset-top)) 2rem max(2rem, env(safe-area-inset-bottom));
    }
    h1 { font-size: 1.75rem; letter-spacing: -0.03em; margin: 0 0 0.75rem; }
    p { color: #a8a29e; max-width: 28rem; line-height: 1.5; margin: 0.4rem auto; }
    a { color: #5eead4; }
    code { color: #fdba74; font-size: 0.9em; }
    strong { color: #fafaf9; }
  </style>
</head>
<body>
  <main>
    <h1>Nexus</h1>
    ${serverUrl ? remoteBody : localBody}
  </main>
</body>
</html>
`;

fs.writeFileSync(path.join(www, "index.html"), html, "utf8");
fs.writeFileSync(
  path.join(www, "cap-mode.json"),
  JSON.stringify(
    {
      mode: serverUrl ? "remote" : "local",
      serverUrl: serverUrl || null,
      allowNavigation: hosts,
      note: "Remote Cap loads HTTPS Nexus; local www cannot run createServerFn.",
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

console.log(
  serverUrl
    ? `Prepared www/ remote bridge → ${serverUrl} (allowNavigation: ${hosts.join(", ") || "n/a"})`
    : "Prepared www/ local shell (no CAPACITOR_SERVER_URL — not a store-ready remote app)",
);
