// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminReferrals";

export const Route = createFileRoute("/admin/referrals")({
  head: () =>
    pageSeo({
      title: "Referrals Admin | GameFlex",
      description: "Monitor user referrals, referral code tracking and signup statistics.",
      noindex: true,
    }),
  component: Page,
});
