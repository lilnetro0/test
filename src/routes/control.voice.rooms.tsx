import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/control/voice/rooms")({
  component: () => <Outlet />,
});
