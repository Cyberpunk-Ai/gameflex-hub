// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import AdminLayout from "@/pages/admin/AdminLayout";

export const Route = createFileRoute("/admin")({
  head: () =>
    pageSeo({
      title: "Admin | GameFlex",
      description: "Administration console for the GameFlex platform.",
      noindex: true,
    }),
  component: AdminLayout,
});
