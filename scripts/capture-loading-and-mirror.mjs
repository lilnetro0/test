import { chromium, devices } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs", "ui-walkthrough");
const PUBLIC = path.join(ROOT, "public", "ui-walkthrough");
const BASE = process.env.WALKTHROUGH_BASE || "http://127.0.0.1:5173";
const iphone = devices["iPhone 14"];

const browser = await chromium.launch({ headless: true });
for (const lang of ["en", "ar"]) {
  const context = await browser.newContext({
    ...iphone,
    colorScheme: "dark",
    locale: lang === "ar" ? "ar-SA" : "en-US",
  });
  const page = await context.newPage();
  await page.addInitScript((l) => {
    localStorage.setItem("nexus.onboarding.seen.v1", "1");
    localStorage.setItem("nexus.whatsnew.seen.v3", "1");
    localStorage.setItem("nexus.lang", l);
  }, lang);
  await page.goto(`${BASE}/notifications`, { waitUntil: "networkidle" });
  await page.evaluate((title) => {
    const main = document.querySelector("main") || document.body;
    const rows = Array.from({ length: 6 })
      .map(
        () => `<div class="flex min-h-11 items-center gap-3 px-4 py-3">
            <div class="size-10 shrink-0 animate-pulse rounded-full bg-white/10"></div>
            <div class="min-w-0 flex-1 space-y-2">
              <div class="h-3.5 w-2/5 animate-pulse rounded bg-white/10"></div>
              <div class="h-3 w-4/5 animate-pulse rounded bg-white/5"></div>
            </div>
          </div>`,
      )
      .join("");
    main.innerHTML = `<header class="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <h1 class="nx-title truncate">${title}</h1>
      </header>
      <div class="space-y-1" aria-busy="true">${rows}</div>`;
  }, lang === "ar" ? "الإشعارات" : "Notifications");
  await page.waitForTimeout(250);
  await page.screenshot({
    path: path.join(OUT, lang, "22-loading.png"),
    animations: "disabled",
  });
  console.log("loading", lang);
  await context.close();
}
await browser.close();

// Mirror gallery into public/ for Vite serving
fs.cpSync(OUT, PUBLIC, { recursive: true });
console.log("mirrored →", PUBLIC);
