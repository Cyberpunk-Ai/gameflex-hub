// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminUsers";

export const Route = createFileRoute("/admin/users")({
  head: () =>
    pageSeo({
      title: "Manage Users | GameFlex Admin",
      description: "Search, verify, suspend and audit GameFlex player accounts.",
      noindex: true,
    }),
  component: Page,
});
