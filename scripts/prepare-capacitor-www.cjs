/**
 * Build Capacitor webDir (www/) with index.html + optional Nitro public assets.
 */
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const www = path.join(root, "www");
const publicDir = path.join(root, ".output", "public");

const serverUrl = String(
  process.env.CAPACITOR_SERVER_URL || process.env.SITE_URL || "",
).replace(/\/$/, "");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else if (entry.isFile()) {
      fs.copyFileSync(from, to);
    }
  }
}

ensureDir(www);

if (fs.existsSync(publicDir)) {
  try {
    copyDir(publicDir, www);
  } catch (err) {
    console.warn("Could not copy .output/public:", err.message);
  }
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const body = serverUrl
  ? `<p>Opening Nexus…</p><p><a href="${escapeHtml(serverUrl)}">Continue</a></p>
<script>location.replace(${JSON.stringify(serverUrl)});</script>`
  : `<p>Deploy Nexus over HTTPS, then set <code>CAPACITOR_SERVER_URL</code> and rebuild so the iOS shell loads your live app.</p>`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="format-detection" content="telephone=no" />
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
      padding: 2rem;
    }
    h1 { font-size: 1.75rem; letter-spacing: -0.03em; margin: 0 0 0.75rem; }
    p { color: #a8a29e; max-width: 28rem; line-height: 1.5; }
    a { color: #fb923c; }
    code { color: #fdba74; font-size: 0.9em; }
  </style>
</head>
<body>
  <main>
    <h1>Nexus</h1>
    ${body}
  </main>
</body>
</html>
`;

fs.writeFileSync(path.join(www, "index.html"), html, "utf8");

console.log(
  serverUrl
    ? `Prepared www/ (server URL: ${serverUrl})`
    : "Prepared www/ (no CAPACITOR_SERVER_URL — IPA will build; set URL for a live app shell)",
);
