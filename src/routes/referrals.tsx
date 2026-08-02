// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/ReferralDashboard";

export const Route = createFileRoute("/referrals")({
  head: () =>
    pageSeo({
      title: "Referral Program | GameFlex",
      description: "Invite friends to GameFlex and earn bonus rewards.",
    }),
  component: Page,
});
