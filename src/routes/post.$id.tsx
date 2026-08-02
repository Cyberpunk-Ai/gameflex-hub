// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/social/PostDetail";

export const Route = createFileRoute("/post/$id")({
  head: () =>
    pageSeo({
      title: "Post | GameFlex Social",
      description: "A clip, highlight or update shared by a player in the GameFlex community.",
    }),
  component: Page,
});
