// @ts-nocheck
import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import React, { lazy, Suspense } from "react";

const LazyPage = lazy(() => import("@/pages/social/Reels"));
const Page: any = (props: any) => (
  <Suspense fallback={null}>
    <LazyPage {...props} />
  </Suspense>
);
export const Route = createFileRoute("/reels")({
  head: () =>
    pageSeo({
      title: "Flex — Short Gaming Clips | GameFlex",
      description: "Scroll the best short-form gameplay clips uploaded by GameFlex creators.",
    }),
  component: Page,
});
