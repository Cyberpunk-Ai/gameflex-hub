// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Auth";

export const Route = createFileRoute("/auth")({
  head: () =>
    pageSeo({
      title: "Authentication | GameFlex",
      description: "Sign in or create your account.",
      noindex: true,
    }),
  component: Page,
});
