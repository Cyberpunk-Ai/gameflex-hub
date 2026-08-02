// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/ResetPassword";

export const Route = createFileRoute("/reset-password")({
  head: () =>
    pageSeo({
      title: "Set a New Password | GameFlex",
      description: "Choose a new password to regain access to your GameFlex account.",
      noindex: true,
    }),
  component: Page,
});
