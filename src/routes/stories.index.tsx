// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/social/Stories";
export const Route = createFileRoute("/stories/")({
  head: () =>
    pageSeo({
      title: "Stories | GameFlex",
      description: "24-hour highlights from players, teams and tournaments across GameFlex.",
    }),
  component: Page,
});
