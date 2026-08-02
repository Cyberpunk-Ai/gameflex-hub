// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Refund";

export const Route = createFileRoute("/refund")({
  head: () =>
    pageSeo({
      title: "Refund Policy | GameFlex",
      description: "GameFlex Refund Policy and Cancellation Terms.",
    }),
  component: Page,
});
