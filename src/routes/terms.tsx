// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Terms";

export const Route = createFileRoute("/terms")({
  head: () =>
    pageSeo({
      title: "Terms of Service | GameFlex",
      description: "The rules and legal terms that govern your use of GameFlex.",
    }),
  component: Page,
});
