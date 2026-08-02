import { Outlet, useLocation } from "@/lib/router-compat";
import { Header } from "./header";
import { Footer } from "./footer";

export function Layout() {
  const location = useLocation();
  const socialPaths = [
    "/social",
    "/explore",
    "/reels",
    "/stories",
    "/search",
    "/trending",
    "/saved",
    "/activity",
    "/friends",
    "/teams",
    "/live",
    "/create",
    "/post/",
    "/creator/",
    "/player/",
  ];
  const p = location.pathname;
  const isSocialProfile =
    p === "/social/profile" || p.startsWith("/social/profile/") || p === "/social/settings";
  const isSocial =
    isSocialProfile ||
    socialPaths.some(
      (sp) => p === sp || p.startsWith(sp + "/") || (sp.endsWith("/") && p.startsWith(sp)),
    ) ||
    p === "/messages" ||
    p.startsWith("/messages/") ||
    p === "/notifications";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative">
      {!isSocial && <Header />}
      <main
        className={isSocial ? "flex-1 flex flex-col min-w-0" : "flex-1 pt-20 flex flex-col min-w-0"}
      >
        <Outlet />
      </main>
      {!isSocial && <Footer />}
    </div>
  );
}
