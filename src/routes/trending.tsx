// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/social/Trending";
export const Route = createFileRoute("/trending")({
  head: () =>
    pageSeo({
      title: "Trending on GameFlex",
      description: "The hottest clips, creators and tournaments right now across the community.",
    }),
  component: Page,
});
