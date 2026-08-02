// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/MyMatches";

export const Route = createFileRoute("/my-matches")({
  head: () =>
    pageSeo({
      title: "My Matches | GameFlex",
      description: "Review your upcoming fixtures, results, disputes and match history.",
      noindex: true,
    }),
  component: Page,
});
