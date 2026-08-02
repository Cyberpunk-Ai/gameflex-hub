// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminAchievements";

export const Route = createFileRoute("/admin/achievements")({
  head: () =>
    pageSeo({
      title: "Achievements Admin | GameFlex",
      description: "Create and manage badges and achievement criteria.",
      noindex: true,
    }),
  component: Page,
});
