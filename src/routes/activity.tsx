// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/social/Activity";
export const Route = createFileRoute("/activity")({
  head: () =>
    pageSeo({
      title: "Your Activity Feed | GameFlex",
      description:
        "See likes, follows, comments and match updates from the players and teams you follow.",
      noindex: true,
    }),
  component: Page,
});
