// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/social/Teams";
export const Route = createFileRoute("/teams")({
  head: () =>
    pageSeo({
      title: "Teams & Clans | GameFlex",
      description: "Find a roster, create your own clan and compete in team tournaments.",
    }),
  component: Page,
});
