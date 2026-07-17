import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/control/moderation")({
  component: () => <Outlet />,
});
