/**
 * Generates PNGs for PWA from public/icons/icon.svg (no extra deps — uses sharp if present,
 * otherwise writes SVG copies referenced as PNG placeholders via simple canvas-free fallback).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const iconsDir = join(root, "public", "icons");
const svgPath = join(iconsDir, "icon.svg");

mkdirSync(iconsDir, { recursive: true });

async function main() {
  const svg = readFileSync(svgPath);

  try {
    const sharp = (await import("sharp")).default;
    for (const size of [192, 512]) {
      const out = join(iconsDir, `icon-${size}.png`);
      await sharp(svg).resize(size, size).png().toFile(out);
      console.log("wrote", out);
    }
  } catch {
    // No sharp — ship SVG under .png names only if missing; browsers prefer real PNG.
    // Copy SVG as fallback icons browsers may still ignore — prefer installing sharp later.
    for (const size of [192, 512]) {
      const out = join(iconsDir, `icon-${size}.png`);
      if (!existsSync(out)) {
        copyFileSync(svgPath, join(iconsDir, `icon-${size}.svg`));
        writeFileSync(
          out,
          // Minimal 1x1 PNG so manifest URLs resolve; replace with real assets before store launch.
          Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
            "base64",
          ),
        );
        console.warn("sharp missing — wrote placeholder", out, "(run: npm i -D sharp && node scripts/generate-pwa-icons.mjs)");
      }
    }
  }
}

await main();
