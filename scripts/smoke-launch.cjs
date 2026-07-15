/**
 * Launch / App Store packaging smoke (no simulator, no ASC API).
 * Run: npm run smoke:launch
 */
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
let failed = 0;

function ok(msg) {
  console.log(`  ok  ${msg}`);
}
function fail(msg) {
  failed += 1;
  console.error(`  FAIL  ${msg}`);
}
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}
function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

console.log("smoke:launch — App Store / launch packaging\n");

if (exists("docs/APP-STORE.md") && exists("LAUNCH.md") && exists("docs/CAPACITOR.md")) {
  ok("APP-STORE.md + LAUNCH.md + CAPACITOR.md present");
} else {
  fail("Missing APP-STORE.md / LAUNCH.md / CAPACITOR.md");
}

{
  const cfg = read("capacitor.config.ts");
  if (cfg.includes('appId: "com.lilnetro0.nexus"') && cfg.includes('appName: "Nexus"')) {
    ok("capacitor.config.ts appId / appName");
  } else {
    fail("capacitor.config.ts identity mismatch");
  }
}

{
  const plist = read("ios/App/App/Info.plist");
  const checks = [
    ["Nexus", "CFBundleDisplayName Nexus"],
    ["ITSAppUsesNonExemptEncryption", "export compliance key"],
    ["NSMicrophoneUsageDescription", "mic usage string"],
    ["NSCameraUsageDescription", "camera usage string"],
    ["NSPhotoLibraryUsageDescription", "photo library usage string"],
    ["com.lilnetro0.nexus", "URL scheme"],
    ["<string>audio</string>", "UIBackgroundModes audio"],
  ];
  for (const [needle, label] of checks) {
    if (plist.includes(needle)) ok(`Info.plist ${label}`);
    else fail(`Info.plist missing ${label}`);
  }
  if (
    /ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/s.test(plist) ||
    (plist.includes("ITSAppUsesNonExemptEncryption") && plist.includes("<false/>"))
  ) {
    ok("Info.plist encryption exempt = false");
  } else {
    fail("Info.plist ITSAppUsesNonExemptEncryption should be false");
  }
}

{
  if (!exists("ios/App/App/PrivacyInfo.xcprivacy")) {
    fail("PrivacyInfo.xcprivacy missing");
  } else {
    const p = read("ios/App/App/PrivacyInfo.xcprivacy");
    if (p.includes("NSPrivacyTracking") && p.includes("<false/>")) ok("PrivacyInfo.xcprivacy (no tracking)");
    else fail("PrivacyInfo.xcprivacy tracking flag unexpected");
  }
}

for (const size of [192, 512]) {
  const rel = `public/icons/icon-${size}.png`;
  if (!exists(rel)) {
    fail(`${rel} missing — run npm run icons`);
    continue;
  }
  const bytes = fs.statSync(path.join(root, rel)).size;
  if (bytes > 1000) ok(`${rel} (${bytes} bytes)`);
  else fail(`${rel} too small (${bytes} bytes) — regenerate with sharp`);
}

for (const r of ["terms", "privacy", "cookies", "guidelines", "help"]) {
  if (exists(`src/routes/${r}.tsx`)) ok(`route /${r}`);
  else fail(`missing src/routes/${r}.tsx`);
}

{
  const yml = read("codemagic.yaml");
  if (
    yml.includes("ios-capacitor") &&
    yml.includes("submit_to_testflight") &&
    yml.includes("com.lilnetro0.nexus")
  ) {
    ok("codemagic.yaml ios-capacitor → TestFlight");
  } else {
    fail("codemagic.yaml missing ios TestFlight wiring");
  }
  if (yml.includes("android-capacitor")) ok("codemagic.yaml android-capacitor scaffold");
  else fail("codemagic.yaml missing android-capacitor workflow");
}

{
  if (exists("docs/store/en-US/listing.txt") && exists("docs/store/REVIEW-NOTES.txt")) {
    ok("docs/store listing + Review Notes");
  } else {
    fail("docs/store metadata missing");
  }
  if (exists("fastlane/Deliverfile")) ok("fastlane/Deliverfile present");
  else fail("fastlane/Deliverfile missing");
}

if (failed) {
  console.error(`\nsmoke:launch FAILED (${failed})`);
  process.exit(1);
}
console.log("\nsmoke:launch ok");
process.exit(0);
