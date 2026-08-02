// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/social/CreatorPage";

export const Route = createFileRoute("/creator/$id")({
  head: () =>
    pageSeo({
      title: "Creator Page | GameFlex",
      description: "Clips, streams, followers and highlights from this GameFlex creator.",
    }),
  component: Page,
});
