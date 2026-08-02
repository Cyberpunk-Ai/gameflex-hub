// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/social/Live";
export const Route = createFileRoute("/live")({
  head: () =>
    pageSeo({
      title: "Live Streams | GameFlex",
      description: "Watch live matches and creator streams happening right now on GameFlex.",
    }),
  component: Page,
});
