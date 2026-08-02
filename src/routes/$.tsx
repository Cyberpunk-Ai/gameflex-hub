// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import NotFound from "@/pages/NotFound";

export const Route = createFileRoute("/$")({
  head: () =>
    pageSeo({
      title: "Page Not Found | GameFlex",
      description: "This GameFlex page doesn't exist or has been moved.",
      noindex: true,
    }),
  component: NotFound,
});
