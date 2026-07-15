import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

/** Set SITE_URL in production (e.g. https://nexus.example.com). */
const BASE_URL = (process.env.SITE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

const PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/discover",
  "/friends",
  "/dm",
  "/settings",
  "/notifications",
  "/help",
  "/terms",
  "/privacy",
  "/guidelines",
  "/cookies",
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls = PATHS.map(
          (p) => `  <url><loc>${BASE_URL}${p}</loc><changefreq>weekly</changefreq></url>`,
        ).join("\n");
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          urls,
          `</urlset>`,
        ].join("\n");
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
