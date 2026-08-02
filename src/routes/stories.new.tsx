// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/social/StoryNew";
export const Route = createFileRoute("/stories/new")({
  head: () =>
    pageSeo({
      title: "Post a Story | GameFlex",
      description: "Share a 24-hour highlight from your latest match with your followers.",
      noindex: true,
    }),
  component: Page,
});
