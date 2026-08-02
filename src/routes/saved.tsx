// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/social/Saved";
export const Route = createFileRoute("/saved")({
  head: () =>
    pageSeo({
      title: "Saved Posts | GameFlex",
      description: "Your bookmarked clips, guides and marketplace listings.",
      noindex: true,
    }),
  component: Page,
});
