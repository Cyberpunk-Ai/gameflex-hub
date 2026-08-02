// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminDashboard";

export const Route = createFileRoute("/admin/")({
  head: () =>
    pageSeo({
      title: "Admin Dashboard | GameFlex",
      description: "Admin overview dashboard.",
      noindex: true,
    }),
  component: Page,
});
