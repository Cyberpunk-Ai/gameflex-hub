// @ts-nocheck
import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout route for /social — child routes (index, profile, settings) render here.
export const Route = createFileRoute("/social")({
  component: () => <Outlet />,
});
