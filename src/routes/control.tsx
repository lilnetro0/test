import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ControlShell } from "@/components/control/control-shell";
import { translateStatic } from "@/lib/i18n";

export const Route = createFileRoute("/control")({
  head: () => ({
    meta: [{ title: translateStatic("meta.page.control") }, { name: "robots", content: "noindex" }],
  }),
  component: ControlLayout,
});

function ControlLayout() {
  return (
    <ControlShell>
      <Outlet />
    </ControlShell>
  );
}
