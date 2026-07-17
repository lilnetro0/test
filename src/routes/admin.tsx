import { createFileRoute, redirect } from "@tanstack/react-router";
import { translateStatic } from "@/lib/i18n";

/**
 * Legacy five-tab admin — retired after Control P1–P2 parity.
 * Keep the URL so bookmarks and old links land in Nexus Control.
 */
export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: translateStatic("meta.page.admin") },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/control", replace: true });
  },
});
