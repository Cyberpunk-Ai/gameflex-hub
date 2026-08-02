// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/social/Search";
export const Route = createFileRoute("/search")({
  head: () =>
    pageSeo({
      title: "Search GameFlex",
      description:
        "Find players, teams, tournaments, clips and marketplace listings across GameFlex.",
    }),
  component: Page,
});
