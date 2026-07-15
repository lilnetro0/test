/**
 * Ensures ios/.../capacitor.config.json has server.url + allowNavigation
 * from CAPACITOR_SERVER_URL / SITE_URL. Fail-closed for remote TestFlight builds.
 */
const fs = require("node:fs");
const path = require("node:path");
const {
  resolveCapacitorServerUrl,
  assertRemoteServerUrl,
  allowNavigationHosts,
} = require("./resolve-capacitor-server.cjs");

const serverUrl = resolveCapacitorServerUrl();
assertRemoteServerUrl(serverUrl);
const hosts = allowNavigationHosts(serverUrl);

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
  allowNavigation: hosts,
};

fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf8");
console.log("Injected server.url →", serverUrl);
console.log("allowNavigation →", hosts.join(", "));
console.log("Wrote", configPath);
