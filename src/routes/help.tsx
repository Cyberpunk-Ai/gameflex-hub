// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/FAQs";

export const Route = createFileRoute("/help")({
  head: () =>
    pageSeo({
      title: "GameFlex Help & FAQ",
      description: "Get help, find answers to common questions, and learn how to use GameFlex.",
    }),
  component: Page,
});
