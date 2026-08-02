// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Settings";

export const Route = createFileRoute("/settings")({
  head: () =>
    pageSeo({
      title: "Account Settings | GameFlex",
      description: "Manage security, notifications, privacy, payouts and connected game accounts.",
      noindex: true,
    }),
  component: Page,
});
