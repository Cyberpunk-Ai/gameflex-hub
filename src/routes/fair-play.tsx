// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/FairPlay";

export const Route = createFileRoute("/fair-play")({
  head: () =>
    pageSeo({
      title: "Fair Play Guidelines | GameFlex",
      description: "Our rules and commitment to fair play and anti-cheat policies.",
    }),
  component: Page,
});
