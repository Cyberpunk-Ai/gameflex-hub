// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminTournaments";

export const Route = createFileRoute("/admin/tournaments")({
  head: () =>
    pageSeo({
      title: "Manage Tournaments | GameFlex Admin",
      description: "Create, edit and settle tournaments and their prize pools.",
      noindex: true,
    }),
  component: Page,
});
