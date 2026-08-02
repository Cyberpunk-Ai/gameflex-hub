// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Support";

export const Route = createFileRoute("/api")({
  head: () =>
    pageSeo({
      title: "GameFlex API & Developer Support",
      description: "Developer resources and API support for GameFlex platform.",
    }),
  component: Page,
});
