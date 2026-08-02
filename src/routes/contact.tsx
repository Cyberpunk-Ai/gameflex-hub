// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Contact";

export const Route = createFileRoute("/contact")({
  head: () =>
    pageSeo({
      title: "Contact Us | GameFlex",
      description: "Get in touch with the GameFlex support team.",
    }),
  component: Page,
});
