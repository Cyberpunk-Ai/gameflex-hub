// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Achievements";

export const Route = createFileRoute("/achievements")({
  head: () =>
    pageSeo({
      title: "Achievements | GameFlex",
      description: "Track your gaming badges, achievements, and milestones.",
    }),
  component: Page,
});
