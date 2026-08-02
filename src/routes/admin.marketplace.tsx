// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminMarketplace";

export const Route = createFileRoute("/admin/marketplace")({
  head: () =>
    pageSeo({
      title: "Marketplace Moderation | GameFlex Admin",
      description: "Review listings, sellers and escrow disputes in the GameFlex marketplace.",
      noindex: true,
    }),
  component: Page,
});
