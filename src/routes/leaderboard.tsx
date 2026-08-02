// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Leaderboard";

export const Route = createFileRoute("/leaderboard")({
  head: () =>
    pageSeo({
      title: "Global Leaderboard | GameFlex",
      description: "See the top-ranked players and teams by earnings, wins and rating this season.",
    }),
  component: Page,
});
