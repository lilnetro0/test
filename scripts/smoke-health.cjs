/**
 * Post-deploy / CI readiness probe against GET /api/health.
 * Run: npm run ops:health
 *
 * URL resolution (first set wins):
 *   HEALTH_CHECK_URL  — full URL or origin
 *   CAPACITOR_SERVER_URL
 *   SITE_URL
 *
 * Skips (exit 0) when none are set — local/CI without a deploy target.
 * Set OPS_HEALTH_REQUIRE=1 to fail when URL is missing.
 */
const https = require("node:https");
const http = require("node:http");

function resolveHealthUrl() {
  const raw = (
    process.env.HEALTH_CHECK_URL ||
    process.env.CAPACITOR_SERVER_URL ||
    process.env.SITE_URL ||
    ""
  )
    .trim()
    .replace(/\/$/, "");
  if (!raw) return null;
  if (/\/api\/health$/i.test(raw)) return raw;
  return `${raw}/api/health`;
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https:") ? https : http;
    const req = lib.get(url, { timeout: 10000 }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        resolve({ status: res.statusCode || 0, body });
      });
    });
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
    req.on("error", reject);
  });
}

async function main() {
  const url = resolveHealthUrl();
  if (!url) {
    if (process.env.OPS_HEALTH_REQUIRE === "1") {
      console.error("ops:health FAIL — no HEALTH_CHECK_URL / CAPACITOR_SERVER_URL / SITE_URL");
      process.exit(1);
    }
    console.log("ops:health — skipped (no deploy URL env)");
    process.exit(0);
  }

  console.log(`ops:health — GET ${url}`);
  try {
    const { status, body } = await fetchJson(url);
    let ok = status === 200;
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed.ok === "boolean") ok = status === 200 && parsed.ok === true;
      console.log(`  status=${status} ok=${parsed.ok} supabase=${parsed.supabase?.ok} livekit.configured=${parsed.livekit?.configured} livekit.reachable=${parsed.livekit?.reachable}`);
    } catch {
      console.log(`  status=${status} body=${body.slice(0, 200)}`);
    }
    if (!ok) {
      console.error("ops:health FAIL");
      process.exit(1);
    }
    console.log("ops:health ok");
    process.exit(0);
  } catch (err) {
    console.error(`ops:health FAIL — ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

main();
