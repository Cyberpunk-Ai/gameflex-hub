// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/HowItWorks";

export const Route = createFileRoute("/about")({
  head: () =>
    pageSeo({
      title: "About GameFlex",
      description: "Learn about GameFlex, our gaming platform, competitive matches, and community.",
    }),
  component: Page,
});
