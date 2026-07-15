/**
 * Ensures ios/.../capacitor.config.json has server.url from CAPACITOR_SERVER_URL / SITE_URL.
 * Runs after `npx cap sync` so Codemagic env is never dropped silently.
 */
const fs = require("node:fs");
const path = require("node:path");

const serverUrl = String(
  process.env.CAPACITOR_SERVER_URL || process.env.SITE_URL || "",
).replace(/\/$/, "");

if (!serverUrl) {
  console.error(
    "CAPACITOR_SERVER_URL (or SITE_URL) is empty. Set it in Codemagic Environment variables and rebuild.",
  );
  process.exit(1);
}

if (!/^https:\/\//i.test(serverUrl)) {
  console.error("CAPACITOR_SERVER_URL must be an https:// URL. Got:", serverUrl);
  process.exit(1);
}

const configPath = path.join(
  process.cwd(),
  "ios",
  "App",
  "App",
  "capacitor.config.json",
);

if (!fs.existsSync(configPath)) {
  console.error("Missing", configPath, "— run npx cap sync ios first.");
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
config.server = {
  ...(config.server && typeof config.server === "object" ? config.server : {}),
  url: serverUrl,
  cleartext: false,
  androidScheme: "https",
  iosScheme: "https",
};

fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf8");
console.log("Injected server.url →", serverUrl);
console.log("Wrote", configPath);
