// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/PlayerProfile";

export const Route = createFileRoute("/player/$id")({
  head: () =>
    pageSeo({
      title: "Player Profile | GameFlex",
      description: "View player stats, achievements, and match history.",
    }),
  component: Page,
});
