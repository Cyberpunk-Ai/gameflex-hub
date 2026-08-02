// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Home";

export const Route = createFileRoute("/")({
  head: () =>
    pageSeo({
      title: "GameFlex Esports | Tournaments & Competitions",
      description: "Compete in FIFA, Mobile Legends, and Call of Duty tournaments to win cash prizes.",
    }),
  component: Page,
});
