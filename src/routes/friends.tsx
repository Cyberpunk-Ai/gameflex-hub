// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/social/Friends";
export const Route = createFileRoute("/friends")({
  head: () =>
    pageSeo({
      title: "Friends & Followers | GameFlex",
      description: "Manage friend requests, followers and squadmates you play with on GameFlex.",
      noindex: true,
    }),
  component: Page,
});
