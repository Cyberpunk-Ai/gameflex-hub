// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Messages";

export const Route = createFileRoute("/messages")({
  head: () =>
    pageSeo({
      title: "Messages | GameFlex",
      description: "Private and team chat with the players you compete alongside.",
      noindex: true,
    }),
  component: Page,
});
