// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Rewards";

export const Route = createFileRoute("/rewards")({
  head: () =>
    pageSeo({
      title: "Rewards & Referrals | GameFlex",
      description: "Earn coins, unlock reward tiers and get paid for inviting friends to GameFlex.",
    }),
  component: Page,
});
