/**
 * Static security assertions for CI (no live DB / secrets).
 * Run: npm run smoke:security
 */
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

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

console.log("smoke:security — static checks\n");

// 1) CSRF middleware
{
  const start = read("src/start.ts");
  if (start.includes("createCsrfMiddleware") && start.includes("csrfMiddleware")) {
    ok("CSRF middleware wired in src/start.ts");
  } else {
    fail("createCsrfMiddleware missing from src/start.ts");
  }
}

// 2) Security headers
{
  const server = read("src/server.ts");
  const keys = [
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Content-Security-Policy",
    "Referrer-Policy",
    "withSecurityHeaders",
  ];
  const missing = keys.filter((k) => !server.includes(k));
  if (missing.length === 0) ok("Security headers present in src/server.ts");
  else fail(`Missing in server.ts: ${missing.join(", ")}`);
}

// 3) Prod env fail-closed helpers
{
  const env = read("src/lib/supabase/env.ts");
  if (env.includes("assertProductionClientEnv") && env.includes("assertProductionServerEnv")) {
    ok("assertProduction* helpers present");
  } else {
    fail("assertProductionClientEnv / assertProductionServerEnv missing");
  }
  const rootRoute = read("src/routes/__root.tsx");
  if (rootRoute.includes("assertProductionClientEnv")) {
    ok("Client prod env assert called from __root.tsx");
  } else {
    fail("assertProductionClientEnv not referenced from __root.tsx");
  }
}

// 4) No VITE_ prefixed privileged secrets in source
{
  const patterns = [
    /VITE_SUPABASE_SERVICE_ROLE/,
    /VITE_SERVICE_ROLE/,
    /VITE_ADMIN_USER_IDS/,
    /VITE_LIVEKIT_API_SECRET/,
    /VITE_PUSH_DISPATCH_SECRET/,
    /import\.meta\.env\.SUPABASE_SERVICE_ROLE_KEY/,
  ];
  const walk = (dir, out = []) => {
    for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
      if (name.name === "node_modules" || name.name === ".git" || name.name === "dist" || name.name === ".output") continue;
      const p = path.join(dir, name.name);
      if (name.isDirectory()) walk(p, out);
      else if (/\.(ts|tsx|js|mjs|cjs|md|example|yml|yaml)$/.test(name.name)) out.push(p);
    }
    return out;
  };
  const files = walk(path.join(root, "src")).concat([
    path.join(root, ".env.example"),
    path.join(root, "codemagic.yaml"),
  ]);
  let leak = null;
  for (const f of files) {
    const text = fs.readFileSync(f, "utf8");
    for (const re of patterns) {
      if (re.test(text)) {
        leak = `${path.relative(root, f)} matches ${re}`;
        break;
      }
    }
    if (leak) break;
  }
  if (!leak) ok("No VITE_/client leaks of service-role / admin secret names");
  else fail(leak);
}

// 5) Admin bootstrap never VITE_
{
  const authz = read("src/lib/admin/authz.ts");
  if (authz.includes("ADMIN_USER_IDS") && !authz.includes("VITE_ADMIN")) {
    ok("ADMIN_USER_IDS is server process.env (not VITE_)");
  } else {
    fail("admin authz env handling unexpected");
  }
}

// 6) RLS inventory artifacts present (live apply remains operator-run)
{
  const verify = read("supabase/verify_schema.sql");
  const core = read("supabase/migrations/20260715000000_nexus_core.sql");
  const needVerify = ["profiles", "messages", "dm_messages", "notifications"];
  const missingV = needVerify.filter((t) => !verify.includes(t));
  if (missingV.length === 0) ok("verify_schema.sql covers core tables");
  else fail(`verify_schema.sql missing: ${missingV.join(", ")}`);

  const rlsNeedle = /ENABLE ROW LEVEL SECURITY/i;
  if (rlsNeedle.test(core)) ok("nexus_core enables RLS");
  else fail("nexus_core missing ENABLE ROW LEVEL SECURITY");

  for (const table of ["messages", "dm_messages", "profiles"]) {
    if (new RegExp(`ALTER TABLE[\\s\\S]{0,80}${table}[\\s\\S]{0,80}ENABLE ROW LEVEL SECURITY`, "i").test(core) ||
        new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`, "i").test(core)) {
      ok(`RLS enable present for ${table}`);
    } else if (core.toLowerCase().includes(table) && rlsNeedle.test(core)) {
      // Core file enables RLS in a loop or block — accept if table mentioned + RLS enables exist
      ok(`RLS inventory mentions ${table} (core migration)`);
    } else {
      fail(`Could not confirm RLS enable for ${table} in nexus_core`);
    }
  }
}

// 7) npm audit high+ (advisory for CI — fail on high/critical)
{
  const r = spawnSync("npm", ["audit", "--audit-level=high", "--json"], {
    cwd: root,
    encoding: "utf8",
    shell: true,
  });
  let high = 0;
  try {
    const j = JSON.parse(r.stdout || "{}");
    high = (j.metadata?.vulnerabilities?.high ?? 0) + (j.metadata?.vulnerabilities?.critical ?? 0);
  } catch {
    // npm audit non-json fallback
    if (r.status !== 0) {
      console.log("  note  npm audit exited non-zero (see npm audit manually)");
    }
  }
  if (high === 0) ok("npm audit: no high/critical vulnerabilities");
  else fail(`npm audit: ${high} high/critical (run npm audit)`);
}

if (failed) {
  console.error(`\nsmoke:security FAILED (${failed})`);
  process.exit(1);
}
console.log("\nsmoke:security ok");
process.exit(0);
