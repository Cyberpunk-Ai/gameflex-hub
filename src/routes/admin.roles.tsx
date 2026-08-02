// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminRoles";

export const Route = createFileRoute("/admin/roles")({
  head: () =>
    pageSeo({
      title: "Manage Roles | GameFlex Admin",
      description: "Assign administrator and moderator roles across the GameFlex platform.",
      noindex: true,
    }),
  component: Page,
});
