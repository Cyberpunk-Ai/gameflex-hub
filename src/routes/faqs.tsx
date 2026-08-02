// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/FAQs";

export const Route = createFileRoute("/faqs")({
  head: () =>
    pageSeo({
      title: "Frequently Asked Questions | GameFlex",
      description: "Find answers to common questions about GameFlex.",
    }),
  component: Page,
});
