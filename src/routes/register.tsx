// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Register";

export const Route = createFileRoute("/register")({
  head: () =>
    pageSeo({
      title: "Register | GameFlex",
      description: "Create a GameFlex account to start competing in esports tournaments.",
      noindex: true,
    }),
  component: Page,
});
