// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminLeaderboard";

export const Route = createFileRoute("/admin/leaderboard")({
  head: () =>
    pageSeo({
      title: "Leaderboard Admin | GameFlex",
      description: "Recalculate rankings and correct leaderboard standings.",
      noindex: true,
    }),
  component: Page,
});
