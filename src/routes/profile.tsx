// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Profile";

export const Route = createFileRoute("/profile")({
  head: () =>
    pageSeo({
      title: "My Profile | GameFlex",
      description: "Edit your gamertag, bio, linked game IDs and public player profile.",
      noindex: true,
    }),
  component: Page,
});
