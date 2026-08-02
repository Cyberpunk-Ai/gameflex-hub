// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/analytics";

export const Route = createFileRoute("/admin/analytics")({
  head: () =>
    pageSeo({
      title: "Admin Analytics | GameFlex",
      description:
        "Traffic, retention, revenue and engagement analytics for the GameFlex platform.",
      noindex: true,
    }),
  component: Page,
});
