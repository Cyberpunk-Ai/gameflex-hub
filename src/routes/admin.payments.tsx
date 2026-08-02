// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminPayments";

export const Route = createFileRoute("/admin/payments")({
  head: () =>
    pageSeo({
      title: "Payments & Payouts | GameFlex Admin",
      description: "Review deposits, withdrawals and payout approvals across the platform.",
      noindex: true,
    }),
  component: Page,
});
