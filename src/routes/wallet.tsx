// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Wallet";

export const Route = createFileRoute("/wallet")({
  head: () =>
    pageSeo({
      title: "Wallet & Payouts | GameFlex",
      description: "Deposit, withdraw and review every transaction in your GameFlex wallet.",
      noindex: true,
    }),
  component: Page,
});
