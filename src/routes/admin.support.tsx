// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminSupport";

export const Route = createFileRoute("/admin/support")({
  head: () =>
    pageSeo({
      title: "Support Tickets | GameFlex Admin",
      description: "Triage and respond to player support tickets.",
      noindex: true,
    }),
  component: Page,
});
