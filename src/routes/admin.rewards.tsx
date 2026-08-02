// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminRewards";

export const Route = createFileRoute("/admin/rewards")({
  head: () =>
    pageSeo({
      title: "Rewards Admin | GameFlex",
      description: "Configure reward tiers, coin rates and referral bonuses.",
      noindex: true,
    }),
  component: Page,
});
