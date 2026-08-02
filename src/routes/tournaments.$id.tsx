// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/TournamentDetail";

export const Route = createFileRoute("/tournaments/$id")({
  head: () =>
    pageSeo({
      title: "Tournament Details | GameFlex",
      description: "View tournament overview, schedule, rules, and leaderboard.",
    }),
  component: Page,
});
