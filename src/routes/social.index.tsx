// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Social";

export const Route = createFileRoute("/social/")({
  head: () =>
    pageSeo({
      title: "GameFlex Social Feed",
      description: "The community feed of clips, match results and posts from players you follow.",
    }),
  component: Page,
});
