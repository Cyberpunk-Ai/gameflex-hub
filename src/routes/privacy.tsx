// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Privacy";

export const Route = createFileRoute("/privacy")({
  head: () =>
    pageSeo({
      title: "Privacy Policy | GameFlex",
      description: "GameFlex Privacy Policy and Data Protection Information.",
    }),
  component: Page,
});
