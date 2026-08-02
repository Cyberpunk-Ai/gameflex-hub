// @ts-nocheck
import { useState } from "react";
import { Link, useLocation, useNavigate } from "@/lib/router-compat";
import {
  Home,
  Search,
  Compass,
  Film,
  MessageCircle,
  PlusSquare,
  Menu,
  Trophy,
  Bookmark,
  Activity as ActivityIcon,
  Users,
  Shield,
  Radio,
  TrendingUp,
  Settings,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  Circle,
  X,
  Bell,
  ChevronRight,
  Camera,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";

const primary = [
  { name: "Home", href: "/social", icon: Home, exact: true },
  { name: "Search", href: "/search", icon: Search },
  { name: "Explore", href: "/explore", icon: Compass },
  { name: "Flex", href: "/reels", icon: Film },
  { name: "Messages", href: "/messages", icon: MessageCircle },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Create", href: "/create", icon: PlusSquare },
];

const moreItems = [
  { name: "Stories", href: "/stories/", icon: Circle },
  { name: "Trending", href: "/trending", icon: TrendingUp },
  { name: "Live", href: "/live", icon: Radio },
  { name: "Saved", href: "/saved", icon: Bookmark },
  { name: "Teams", href: "/teams", icon: Shield },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

function useActive() {
  const location = useLocation();
  return (href: string, exact?: boolean) =>
    exact
      ? location.pathname === href
      : location.pathname === href || location.pathname.startsWith(href + "/");
}

function BrandLink({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link to="/social" className="flex items-center gap-2 group p-2 mb-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
        <Trophy className="h-6 w-6 text-primary drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
      </div>
      {!collapsed && (
        <span className="font-display text-2xl font-bold tracking-tight">
          Game<span className="text-primary text-gradient">Flex</span>
        </span>
      )}
    </Link>
  );
}

function MoreMenu({ collapsed }: { collapsed: boolean }) {
  const { user, profile, logout, isAdmin } = useAuth();
  const isActive = useActive();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-4 w-full rounded-full px-3 py-3 text-base font-medium transition-all outline-none",
          "text-foreground hover:bg-secondary/60",
          collapsed && "justify-center",
        )}
      >
        <Menu className="h-6 w-6 shrink-0 transition-transform group-hover:scale-110" />
        {!collapsed && <span>More</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align={collapsed ? "center" : "start"}
        className="w-64 bg-card border-border/50 p-2 shadow-2xl mb-2 rounded-2xl"
      >
        {user && (
          <>
            <DropdownMenuLabel className="font-normal px-3 py-2">
              <div className="flex flex-col">
                <span className="text-sm font-bold truncate">{profile?.username ?? "User"}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {profile?.email ?? user.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
          </>
        )}
        {moreItems.map((it) => (
          <DropdownMenuItem key={it.name} asChild className="rounded-xl cursor-pointer">
            <Link
              to={it.href}
              className={cn("w-full py-2.5", isActive(it.href) && "bg-secondary/80 font-semibold")}
            >
              <it.icon className="mr-3 h-5 w-5 text-muted-foreground" />
              {it.name}
            </Link>
          </DropdownMenuItem>
        ))}
        {isAdmin && (
          <>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
              <Link to="/admin" className="w-full py-2.5">
                <Shield className="mr-3 h-5 w-5 text-primary" /> Admin Panel
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
          <Link to="/" className="w-full py-2.5">
            <Trophy className="mr-3 h-5 w-5 text-primary" /> Back to GameFlex
          </Link>
        </DropdownMenuItem>
        {user && (
          <DropdownMenuItem
            onClick={logout}
            className="rounded-xl cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive py-2.5"
          >
            <LogOut className="mr-3 h-5 w-5" /> Log out
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarItem({ item, collapsed }: any) {
  const isActive = useActive();
  const active = isActive(item.href, item.exact);
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      className={cn(
        "relative flex items-center gap-4 rounded-full px-3 py-3 text-base transition-all group overflow-hidden",
        active ? "font-bold text-foreground" : "font-medium text-foreground hover:bg-secondary/60",
        collapsed && "justify-center",
      )}
    >
      {active && (
        <motion.div layoutId="nav-pill" className="absolute inset-0 bg-secondary/80 z-0" />
      )}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_8px_rgba(34,197,94,0.8)] z-10" />
      )}
      <div className="relative z-10 flex items-center gap-4">
        <Icon
          className={cn(
            "h-6 w-6 shrink-0 transition-transform group-hover:scale-110",
            active && "stroke-[2.5] text-primary",
          )}
        />
        {!collapsed && <span>{item.name}</span>}
      </div>
    </Link>
  );
}

function DesktopSidebar() {
  const { user, profile } = useAuth();
  const isActive = useActive();
  const activeProfile = isActive("/social/profile");

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="hidden md:flex fixed left-0 top-0 h-screen border-r border-border/30 z-40
                      w-[72px] xl:w-[245px] flex-col justify-between py-6 px-3
                      bg-background/95 backdrop-blur-2xl"
    >
      <div className="flex flex-col gap-1">
        <div className="hidden xl:block px-2">
          <BrandLink />
        </div>
        <div className="xl:hidden flex justify-center">
          <BrandLink collapsed />
        </div>

        <div className="flex flex-col gap-1 mt-2">
          {primary.map((it) => (
            <div key={it.name} className="xl:block">
              <div className="xl:hidden">
                <SidebarItem item={it} collapsed />
              </div>
              <div className="hidden xl:block">
                <SidebarItem item={it} collapsed={false} />
              </div>
            </div>
          ))}

          {user && (
            <Link
              to="/social/profile"
              className={cn(
                "relative flex items-center gap-4 rounded-full px-3 py-3 text-base transition-all group overflow-hidden mt-1",
                activeProfile ? "font-bold text-foreground" : "font-medium hover:bg-secondary/60",
                "xl:justify-start justify-center",
              )}
            >
              {activeProfile && (
                <motion.div layoutId="nav-pill" className="absolute inset-0 bg-secondary/80 z-0" />
              )}
              {activeProfile && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_8px_rgba(34,197,94,0.8)] z-10" />
              )}
              <div className="relative z-10 flex items-center gap-4">
                <div className="relative">
                  <Avatar
                    className={cn(
                      "h-7 w-7 transition-transform group-hover:scale-110",
                      activeProfile && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    )}
                  >
                    <AvatarImage src={profile?.avatar_url ?? ""} className="object-cover" />
                    <AvatarFallback className="text-[10px] bg-secondary text-foreground font-bold">
                      {(profile?.username ?? "U").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary border-2 border-background rounded-full" />
                </div>
                <span className="hidden xl:inline">Profile</span>
              </div>
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 mt-auto px-2">
        <div className="xl:hidden">
          <MoreMenu collapsed />
        </div>
        <div className="hidden xl:block">
          <MoreMenu collapsed={false} />
        </div>
      </div>
    </motion.aside>
  );
}

function MobileTopBar() {
  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b border-border/30 bg-background/80 backdrop-blur-xl">
      <Link to="/social" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Trophy className="h-4 w-4 text-primary drop-shadow-[0_0_4px_rgba(34,197,94,0.5)]" />
        </div>
        <span className="font-display text-xl font-bold tracking-tight">
          Game<span className="text-primary text-gradient">Flex</span>
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          to="/explore"
          className="p-2 rounded-full hover:bg-secondary/60 active:scale-95 transition-transform"
        >
          <Compass className="h-6 w-6" />
        </Link>
        <Link
          to="/notifications"
          className="p-2 rounded-full hover:bg-secondary/60 active:scale-95 transition-transform"
        >
          <Bell className="h-6 w-6" />
        </Link>
        <Link
          to="/messages"
          className="p-2 rounded-full hover:bg-secondary/60 active:scale-95 transition-transform"
        >
          <MessageCircle className="h-6 w-6" />
        </Link>
      </div>
    </header>
  );
}

function MobileBottomNav() {
  const isActive = useActive();
  const { user, profile, logout, isAdmin } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryItems = [
    { name: "Home", href: "/social", icon: Home, exact: true },
    { name: "Search", href: "/search", icon: Search },
    { name: "Create", href: "/create", icon: PlusSquare },
    { name: "Flex", href: "/reels", icon: Film },
  ];

  const sheetItems = [
    { name: "Stories", href: "/stories/", icon: Camera, desc: "24-hour highlights" },
    { name: "Messages", href: "/messages", icon: MessageCircle, desc: "Direct messages" },
    { name: "Notifications", href: "/notifications", icon: Bell, desc: "Activity & alerts" },
    { name: "Trending", href: "/trending", icon: TrendingUp, desc: "What's hot now" },
    { name: "Explore", href: "/explore", icon: Compass, desc: "Discover players" },
    { name: "Saved", href: "/saved", icon: Bookmark, desc: "Saved posts" },
    { name: "Teams", href: "/teams", icon: Shield, desc: "Team hub" },
    { name: "Live", href: "/live", icon: Radio, desc: "Live streams" },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy, desc: "Top players" },
  ];

  if (isAdmin) {
    sheetItems.push({
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      desc: "Admin panel",
    });
  }

  return (
    <>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/30 bg-background/95 backdrop-blur-2xl h-[64px] pb-safe flex items-center justify-around px-1 shadow-[0_-8px_30px_rgba(0,0,0,0.18)]">
        {primaryItems.map((it) => {
          const active = isActive(it.href, (it as any).exact);
          const isCreate = it.name === "Create";
          if (isCreate) {
            return (
              <Link
                key={it.name}
                to={it.href}
                className="flex flex-col items-center justify-center w-full h-full p-2 active:scale-90 transition-transform"
              >
                <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_18px_rgba(34,197,94,0.45)] active:shadow-none transition-shadow">
                  <it.icon className="h-5 w-5 text-primary-foreground stroke-[2.5]" />
                </div>
              </Link>
            );
          }
          return (
            <Link
              key={it.name}
              to={it.href}
              className="flex flex-col items-center justify-center w-full h-full p-2 active:scale-90 transition-transform relative"
            >
              <it.icon
                className={cn(
                  "h-[26px] w-[26px] transition-colors duration-150",
                  active ? "stroke-[2.5] text-foreground" : "text-muted-foreground",
                )}
              />
              {active && (
                <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary shadow-[0_0_4px_rgba(34,197,94,0.9)]" />
              )}
            </Link>
          );
        })}

        {/* More button */}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center w-full h-full p-2 active:scale-90 transition-transform relative">
              <Menu className="h-[26px] w-[26px] text-muted-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="rounded-t-3xl max-h-[85dvh] pb-safe bg-card border-border/50 p-0"
          >
            <div className="px-4 pt-4 pb-2">
              <div className="w-10 h-1 bg-border/60 rounded-full mx-auto mb-4" />
              <SheetHeader className="mb-4 text-left">
                <SheetTitle className="font-display text-xl font-bold tracking-tight flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  GameFlex
                </SheetTitle>
              </SheetHeader>

              {/* Profile row (when logged in) */}
              {user && (
                <SheetClose asChild>
                  <Link
                    to="/social/profile"
                    className="flex items-center gap-3 py-3 px-2 rounded-2xl hover:bg-secondary/50 active:bg-secondary/70 transition-colors mb-2"
                  >
                    <Avatar className="h-11 w-11 border-2 border-primary/30">
                      <AvatarImage src={profile?.avatar_url ?? ""} className="object-cover" />
                      <AvatarFallback className="bg-secondary font-bold text-foreground">
                        {(profile?.username ?? "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{profile?.username ?? "Profile"}</p>
                      <p className="text-xs text-muted-foreground truncate">View your profile</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </SheetClose>
              )}
            </div>

            {/* Nav grid */}
            <div className="overflow-y-auto px-4 pb-6">
              <div className="grid grid-cols-3 gap-2 mb-4">
                {sheetItems.map((it) => {
                  const active = isActive(it.href);
                  return (
                    <SheetClose asChild key={it.name}>
                      <Link
                        to={it.href}
                        className={cn(
                          "flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl transition-all active:scale-95",
                          active
                            ? "bg-primary/15 border border-primary/30"
                            : "bg-secondary/30 hover:bg-secondary/50",
                        )}
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            active ? "bg-primary/20" : "bg-secondary/50",
                          )}
                        >
                          <it.icon
                            className={cn(
                              "h-5 w-5",
                              active ? "text-primary" : "text-muted-foreground",
                            )}
                          />
                        </div>
                        <span
                          className={cn(
                            "text-[11px] font-semibold truncate w-full text-center leading-tight",
                            active ? "text-primary" : "text-foreground/80",
                          )}
                        >
                          {it.name}
                        </span>
                      </Link>
                    </SheetClose>
                  );
                })}
              </div>

              {/* Settings & sign out */}
              <div className="border-t border-border/30 pt-3 flex gap-2">
                <SheetClose asChild>
                  <Link
                    to="/settings"
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors text-sm font-medium text-muted-foreground active:scale-95"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </SheetClose>
                {user && (
                  <button
                    onClick={() => {
                      logout();
                      setMoreOpen(false);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-destructive/10 hover:bg-destructive/20 transition-colors text-sm font-medium text-destructive active:scale-95"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  );
}

export function SocialLayout({ title, subtitle, children, rightRail, headerRight }: any) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col md:flex-row font-sans">
      <DesktopSidebar />
      <MobileTopBar />

      <div className="flex-1 md:pl-[72px] xl:pl-[245px] pb-[64px] md:pb-0 flex min-w-0">
        <div className="flex-1 max-w-[1020px] mx-auto flex w-full justify-center lg:px-8">
          <main className="flex-1 min-w-0 w-full py-2 md:py-8 max-w-full">
            {(title || subtitle || headerRight) && (
              <div className="mb-6 px-4 md:px-0 flex items-center justify-between">
                <div>
                  {title && (
                    <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
                  )}
                  {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
                </div>
                {headerRight && <div>{headerRight}</div>}
              </div>
            )}
            {children}
          </main>

          {rightRail && (
            <aside className="hidden lg:block w-[340px] shrink-0 py-8 pl-10 ml-8 border-l border-border/20">
              <div className="sticky top-8">{rightRail}</div>
            </aside>
          )}
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}

export function SocialNav() {
  return null;
}
