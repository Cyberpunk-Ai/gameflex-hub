// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/social/SocialSettings";
export const Route = createFileRoute("/social/settings")({
  head: () =>
    pageSeo({
      title: "Social Settings | GameFlex",
      description: "Control who can message you, tag you and see your social activity.",
      noindex: true,
    }),
  component: Page,
});
