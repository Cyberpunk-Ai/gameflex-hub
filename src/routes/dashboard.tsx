// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Dashboard";

export const Route = createFileRoute("/dashboard")({
  head: () =>
    pageSeo({
      title: "Player Dashboard | GameFlex",
      description: "Your matches, earnings, rank progress and upcoming tournaments in one place.",
      noindex: true,
    }),
  component: Page,
});
