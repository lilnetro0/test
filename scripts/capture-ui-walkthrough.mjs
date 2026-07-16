/**
 * Captures iPhone-viewport screenshots of the live redesign (EN + AR).
 * Run with: node scripts/capture-ui-walkthrough.mjs
 * Expects Vite at http://127.0.0.1:5173 with mock/unconfigured auth.
 */
import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "docs", "ui-walkthrough");
const BASE = process.env.WALKTHROUGH_BASE || "http://127.0.0.1:5173";

const iphone = devices["iPhone 14"];

function ensureDirs() {
  for (const d of ["en", "ar", "nav", "sheets", "empty", "loading"]) {
    fs.mkdirSync(path.join(OUT, d), { recursive: true });
  }
}

async function seed(page, lang) {
  await page.addInitScript((l) => {
    localStorage.setItem("nexus.onboarding.seen.v1", "1");
    localStorage.setItem("nexus.whatsnew.seen.v3", "1");
    localStorage.setItem("nexus.lang", l);
  }, lang);
}

async function shot(page, rel) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.waitForTimeout(450);
  await page.screenshot({ path: file, fullPage: false, animations: "disabled" });
  console.log("✓", rel);
}

async function goto(page, urlPath) {
  await page.goto(`${BASE}${urlPath}`, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(300);
}

async function clickByText(page, texts) {
  for (const text of texts) {
    const loc = page.getByRole("button", { name: text, exact: true }).first();
    if (await loc.count()) {
      await loc.click({ force: true });
      return true;
    }
  }
  for (const text of texts) {
    const loc = page.getByText(text, { exact: true }).first();
    if (await loc.count()) {
      await loc.click({ force: true });
      return true;
    }
  }
  return false;
}

async function openYouSheet(page, lang) {
  const label = lang === "ar" ? "أنت" : "You";
  await page.getByRole("button", { name: new RegExp(label, "i") }).last().click({ force: true });
  await page.waitForTimeout(500);
}

async function captureLang(browser, lang) {
  const context = await browser.newContext({
    ...iphone,
    locale: lang === "ar" ? "ar-SA" : "en-US",
    colorScheme: "dark",
  });
  const page = await context.newPage();
  await seed(page, lang);
  const L = lang;

  // Auth
  await goto(page, "/login");
  await shot(page, `${L}/01-login.png`);
  await goto(page, "/register");
  await shot(page, `${L}/02-register.png`);

  // Primary app
  await goto(page, "/");
  await shot(page, `${L}/03-home-chat.png`);

  // Hub sheet
  try {
    await page.locator("header button").first().click({ force: true, timeout: 8000 });
    await page.waitForTimeout(600);
    await shot(page, `${L}/04-hub-sheet.png`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  } catch (e) {
    console.warn("hub sheet skipped", e.message);
  }

  // Search sheet
  try {
    const searchBtn = page.locator("header button").nth(1);
    if (await searchBtn.count()) {
      await searchBtn.click({ force: true, timeout: 5000 });
      await page.waitForTimeout(500);
      await shot(page, `${L}/05-search-sheet.png`);
      await page.keyboard.press("Escape");
    }
  } catch (e) {
    console.warn("search sheet skipped", e.message);
  }

  // Members sheet — last header icon group
  try {
    const membersBtn = page.locator("header button").last();
    await membersBtn.click({ force: true, timeout: 5000 });
    await page.waitForTimeout(500);
    await shot(page, `${L}/06-members-sheet.png`);
    await page.keyboard.press("Escape");
  } catch (e) {
    console.warn("members sheet skipped", e.message);
  }

  await goto(page, "/discover");
  await shot(page, `${L}/07-discover.png`);
  const filterBtn = page.locator('button[aria-label*="ilter"], button[aria-label*="تصفية"], button:has-text("Filters"), button:has-text("تصفية")').first();
  if (await filterBtn.count()) {
    await filterBtn.click({ force: true });
    await page.waitForTimeout(500);
    await shot(page, `${L}/08-filter-sheet.png`);
    await page.keyboard.press("Escape");
  }

  await goto(page, "/dm");
  await shot(page, `${L}/09-messages.png`);
  // Try open first thread on mobile
  const thread = page.locator('a[href*="thread"], button, [role="button"]').filter({ hasText: /./ }).nth(2);
  try {
    const firstRow = page.locator("main a, main button").filter({ hasText: /#|@|[A-Za-z\u0600-\u06FF]/ }).first();
    if (await firstRow.count()) {
      await firstRow.click({ force: true });
      await page.waitForTimeout(600);
      await shot(page, `${L}/10-messages-thread.png`);
    }
  } catch {
    /* ignore */
  }

  await goto(page, "/friends");
  await shot(page, `${L}/11-friends.png`);
  await clickByText(page, lang === "ar" ? ["معلّق", "معلق"] : ["Pending"]);
  await page.waitForTimeout(400);
  await shot(page, `${L}/12-friends-pending.png`);
  await clickByText(page, lang === "ar" ? ["محظورون", "محظور"] : ["Blocked"]);
  await page.waitForTimeout(400);
  await shot(page, `${L}/13-friends-blocked-empty.png`);
  // Add friend via header trailing button
  try {
    await clickByText(page, lang === "ar" ? ["إضافة صديق"] : ["Add Friend"]);
    await page.waitForTimeout(400);
    await shot(page, `${L}/14-friends-add.png`);
  } catch (e) {
    console.warn("add friend skipped", e.message);
  }

  await goto(page, "/notifications");
  await shot(page, `${L}/15-notifications.png`);

  await goto(page, "/me");
  await shot(page, `${L}/16-profile-me.png`);

  await goto(page, "/profile/ApexKing");
  await shot(page, `${L}/17-profile-other.png`);

  await goto(page, "/settings");
  await shot(page, `${L}/18-settings-list.png`);
  // Open first settings section on mobile
  const settingsRow = page.locator("main button, main [role='button']").first();
  if (await settingsRow.count()) {
    await settingsRow.click({ force: true });
    await page.waitForTimeout(500);
    await shot(page, `${L}/19-settings-detail.png`);
  }

  // You sheet from home
  await goto(page, "/");
  await openYouSheet(page, lang);
  await shot(page, `${L}/20-you-sheet.png`);
  await page.keyboard.press("Escape");

  // Empty channel: hard — use friends blocked as empty; also home with absurd search
  await goto(page, "/?hubs=1");
  await page.waitForTimeout(700);
  await shot(page, `${L}/21-hubs-deeplink.png`);
  await page.keyboard.press("Escape");

  // Loading: slow network + hard reload of profile
  await context.route("**/*", async (route) => {
    await new Promise((r) => setTimeout(r, 1200));
    await route.continue();
  });
  const loadPage = await context.newPage();
  await seed(loadPage, lang);
  const loadNav = loadPage.goto(`${BASE}/profile/ApexKing`, { waitUntil: "commit", timeout: 60000 });
  await loadPage.waitForTimeout(400);
  await shot(loadPage, `${L}/22-loading.png`);
  await loadNav.catch(() => {});
  await context.unroute("**/*");
  await loadPage.close();

  // Nav demo sequence (same lang folder copies into nav/)
  const navSteps = [
    ["01-login", "/login"],
    ["02-home", "/"],
    ["03-discover", "/discover"],
    ["04-messages", "/dm"],
    ["05-friends", "/friends"],
    ["06-you", "/"],
  ];
  for (const [name, p] of navSteps) {
    await goto(page, p);
    if (name === "06-you") await openYouSheet(page, lang);
    await shot(page, `nav/${L}-${name}.png`);
  }

  await context.close();
}

ensureDirs();
const browser = await chromium.launch({ headless: true });
try {
  await captureLang(browser, "en");
  await captureLang(browser, "ar");
  console.log("\nDone →", OUT);
} finally {
  await browser.close();
}

// Mirror into public/ for Vite: /ui-walkthrough/index.html
const pub = path.join(ROOT, "public", "ui-walkthrough");
fs.mkdirSync(pub, { recursive: true });
spawnSync("robocopy", [OUT, pub, "/E", "/NFL", "/NDL", "/NJH", "/NJS", "/nc", "/ns", "/np"], {
  shell: true,
});
console.log("Mirrored →", pub);
