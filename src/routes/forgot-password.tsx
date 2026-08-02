// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/ForgotPassword";

export const Route = createFileRoute("/forgot-password")({
  head: () =>
    pageSeo({
      title: "Reset Your Password | GameFlex",
      description: "Request a secure password reset link for your GameFlex account.",
      noindex: true,
    }),
  component: Page,
});
