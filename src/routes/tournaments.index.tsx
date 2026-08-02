// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Tournaments";

export const Route = createFileRoute("/tournaments/")({
  head: () =>
    pageSeo({
      title: "Tournaments | GameFlex",
      description: "Browse and join competitive gaming tournaments.",
    }),
  component: Page,
});
