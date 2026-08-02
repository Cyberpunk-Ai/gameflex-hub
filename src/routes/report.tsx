// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Report";

export const Route = createFileRoute("/report")({
  head: () =>
    pageSeo({
      title: "Report an Issue | GameFlex",
      description: "Report a match dispute, player misconduct, or technical issue.",
    }),
  component: Page,
});
