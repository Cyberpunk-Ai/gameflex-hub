// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/GameRooms";

export const Route = createFileRoute("/game-rooms")({
  head: () =>
    pageSeo({
      title: "Game Rooms | GameFlex",
      description: "Join active match rooms and game lobbies.",
    }),
  component: Page,
});
