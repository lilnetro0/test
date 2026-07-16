import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Community layout — Game Home is the index; chat is a child route.
 * No shared chrome here so each screen owns its full AppShell stack.
 */
export const Route = createFileRoute("/c/$hubSlug")({
  component: CommunityLayout,
});

function CommunityLayout() {
  return <Outlet />;
}
