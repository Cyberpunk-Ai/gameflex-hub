// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminRegistrations";

export const Route = createFileRoute("/admin/registrations")({
  head: () =>
    pageSeo({
      title: "Tournament Registrations | GameFlex Admin",
      description: "Approve, reject and audit player registrations for each tournament.",
      noindex: true,
    }),
  component: Page,
});
