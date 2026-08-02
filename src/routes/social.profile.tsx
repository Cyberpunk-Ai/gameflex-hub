// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/social/SocialProfile";
export const Route = createFileRoute("/social/profile")({
  head: () =>
    pageSeo({
      title: "Social Profile | GameFlex",
      description: "Your public social presence: posts, followers, highlights and stats.",
      noindex: true,
    }),
  component: Page,
});
