// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Login";

export const Route = createFileRoute("/login")({
  head: () =>
    pageSeo({
      title: "Log In | GameFlex",
      description: "Sign in to your GameFlex account to enter tournaments and manage your wallet.",
      noindex: true,
    }),
  component: Page,
});
