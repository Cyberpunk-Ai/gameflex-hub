// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Support";

export const Route = createFileRoute("/support")({
  head: () =>
    pageSeo({
      title: "Help Center & Support | GameFlex",
      description: "Get help and support for your GameFlex account and tournaments.",
    }),
  component: Page,
});
