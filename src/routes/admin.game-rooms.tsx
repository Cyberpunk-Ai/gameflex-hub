// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/AdminGameRooms";

export const Route = createFileRoute("/admin/game-rooms")({
  head: () =>
    pageSeo({
      title: "Game Rooms Admin | GameFlex",
      description: "Monitor and moderate live game rooms and lobbies.",
      noindex: true,
    }),
  component: Page,
});
