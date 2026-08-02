// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/social/Create";
export const Route = createFileRoute("/create")({
  head: () =>
    pageSeo({
      title: "Create a Post | GameFlex",
      description: "Share clips, match highlights and updates with the GameFlex community.",
      noindex: true,
    }),
  component: Page,
});
