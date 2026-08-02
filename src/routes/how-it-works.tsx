// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/HowItWorks";

export const Route = createFileRoute("/how-it-works")({
  head: () =>
    pageSeo({
      title: "How It Works | GameFlex",
      description: "Learn how to join tournaments, play matches, and withdraw earnings.",
    }),
  component: Page,
});
