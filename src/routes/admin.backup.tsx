// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminBackup";

export const Route = createFileRoute("/admin/backup")({
  head: () =>
    pageSeo({
      title: "Backup & Export | GameFlex Admin",
      description: "Export platform data and manage database backups for GameFlex.",
      noindex: true,
    }),
  component: Page,
});
