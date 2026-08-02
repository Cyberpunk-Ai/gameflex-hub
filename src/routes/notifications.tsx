// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Notifications";

export const Route = createFileRoute("/notifications")({
  head: () =>
    pageSeo({
      title: "Notifications | GameFlex",
      description: "Match invites, payout confirmations, mentions and tournament alerts.",
      noindex: true,
    }),
  component: Page,
});
