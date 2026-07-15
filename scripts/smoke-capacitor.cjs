/**
 * Packaging smoke for Cap dual-mode (no simulator / no Xcode).
 * Run: npm run cap:smoke
 */
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  resolveCapacitorServerUrl,
  allowNavigationHosts,
  hostFromMaybeUrl,
} = require("./resolve-capacitor-server.cjs");

const root = process.cwd();
let failed = 0;

function ok(msg) {
  console.log(`  ok  ${msg}`);
}
function fail(msg) {
  failed += 1;
  console.error(`  FAIL  ${msg}`);
}

console.log("cap:smoke — packaging checks\n");

// 1) allowNavigation includes deploy + supabase host helpers
{
  process.env.CAPACITOR_SERVER_URL = "https://example.nexus.app";
  process.env.VITE_SUPABASE_URL = "https://abcd.supabase.co";
  const hosts = allowNavigationHosts(resolveCapacitorServerUrl());
  if (hosts.includes("example.nexus.app") && hosts.includes("www.example.nexus.app")) {
    ok("allowNavigation includes deploy host + www twin");
  } else {
    fail(`allowNavigation missing deploy hosts: ${hosts.join(",")}`);
  }
  if (hosts.includes("abcd.supabase.co")) {
    ok("allowNavigation includes VITE_SUPABASE_URL host");
  } else {
    fail("allowNavigation missing Supabase host");
  }
  if (hostFromMaybeUrl("abcd.supabase.co") === "abcd.supabase.co") {
    ok("hostFromMaybeUrl accepts bare host");
  } else {
    fail("hostFromMaybeUrl bare host");
  }
}

// 2) prepare remote writes bridge (no .output/public requirement)
{
  const env = {
    ...process.env,
    CAPACITOR_SERVER_URL: "https://example.nexus.app",
    CAPACITOR_REQUIRE_SERVER: "1",
  };
  const r = spawnSync(process.execPath, [path.join(root, "scripts/prepare-capacitor-www.cjs")], {
    cwd: root,
    env,
    encoding: "utf8",
  });
  if (r.status !== 0) {
    fail(`prepare remote failed: ${r.stderr || r.stdout}`);
  } else {
    const index = fs.readFileSync(path.join(root, "www/index.html"), "utf8");
    const mode = fs.readFileSync(path.join(root, "www/cap-mode.json"), "utf8");
    if (index.includes("example.nexus.app") && index.includes("Opening Nexus")) {
      ok("prepare remote writes bridge HTML");
    } else {
      fail("prepare remote HTML missing bridge content");
    }
    if (mode.includes('"mode": "remote"')) ok("cap-mode.json remote");
    else fail("cap-mode.json not remote");
    if (fs.existsSync(path.join(root, "www/.output"))) {
      fail("prepare should not nest .output under www");
    } else {
      ok("prepare does not copy SSR public tree into www");
    }
  }
}

// 3) prepare local (no URL) succeeds and is honest
{
  const env = { ...process.env };
  delete env.CAPACITOR_SERVER_URL;
  delete env.SITE_URL;
  delete env.CAPACITOR_REQUIRE_SERVER;
  const r = spawnSync(process.execPath, [path.join(root, "scripts/prepare-capacitor-www.cjs")], {
    cwd: root,
    env,
    encoding: "utf8",
  });
  if (r.status !== 0) {
    fail(`prepare local failed: ${r.stderr || r.stdout}`);
  } else {
    const index = fs.readFileSync(path.join(root, "www/index.html"), "utf8");
    if (index.includes("createServerFn") || index.includes("CAPACITOR_SERVER_URL")) {
      ok("prepare local writes honest shell");
    } else {
      fail("prepare local shell missing guidance");
    }
  }
}

// 4) REQUIRE_SERVER fails closed without URL
{
  const env = { ...process.env, CAPACITOR_REQUIRE_SERVER: "1" };
  delete env.CAPACITOR_SERVER_URL;
  delete env.SITE_URL;
  const r = spawnSync(process.execPath, [path.join(root, "scripts/prepare-capacitor-www.cjs")], {
    cwd: root,
    env,
    encoding: "utf8",
  });
  if (r.status !== 0) ok("CAPACITOR_REQUIRE_SERVER=1 fails without URL");
  else fail("expected prepare to exit non-zero without URL");
}

// 5) SPM drift warning (push package)
{
  const spm = path.join(root, "ios/App/CapApp-SPM/Package.swift");
  if (!fs.existsSync(spm)) {
    fail("missing CapApp-SPM/Package.swift");
  } else {
    const text = fs.readFileSync(spm, "utf8");
    if (text.includes("CapacitorPushNotifications") || text.includes("push-notifications")) {
      ok("Package.swift includes push-notifications");
    } else {
      console.warn(
        "  warn  Package.swift lacks CapacitorPushNotifications — run `npx cap sync ios` after install",
      );
      ok("Package.swift present (push sync warned)");
    }
  }
}

// 6) Android platform status (docs-only until added)
{
  const android = path.join(root, "android");
  if (fs.existsSync(android)) ok("android/ present");
  else {
    console.warn("  warn  android/ not in repo yet — see docs/CAPACITOR.md § Android");
    ok("android deferral documented via smoke warning");
  }
}

console.log("");
if (failed) {
  console.error(`cap:smoke failed (${failed})`);
  process.exit(1);
}
console.log("cap:smoke passed");
