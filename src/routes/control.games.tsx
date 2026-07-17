import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/control/games")({
  component: () => <Outlet />,
});
