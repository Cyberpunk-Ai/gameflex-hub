// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminMatches";

export const Route = createFileRoute("/admin/matches")({
  head: () =>
    pageSeo({
      title: "Manage Matches | GameFlex Admin",
      description: "Resolve results, disputes and scheduling across all live matches.",
      noindex: true,
    }),
  component: Page,
});
