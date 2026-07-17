import { createFileRoute, Outlet } from "@tanstack/react-router";

/** Layout for /control/audit and /control/audit/$eventId */
export const Route = createFileRoute("/control/audit")({
  component: ControlAuditLayout,
});

function ControlAuditLayout() {
  return <Outlet />;
}
