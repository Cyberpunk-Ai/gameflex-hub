// @ts-nocheck
import { Link, useLocation } from "@/lib/router-compat";
import { optimizeImageUrl } from "@/utils/media-optimizer";
import { useState, useEffect } from "react";
import {
  Trophy,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  LayoutDashboard,
  Bell,
  Wallet,
  Shield,
  MessageCircle,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getGamerAvatar } from "@/constants/avatars";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Tournaments", href: "/tournaments" },
  { name: "Leaderboard", href: "/leaderboard" },
  { name: "Achievements", href: "/achievements" },
  { name: "Social", href: "/social" },
  { name: "Marketplace", href: "/marketplace" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen]);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-notifications", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      return count || 0;
    },
    enabled: !!user,
    staleTime: 5_000,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("header-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["unread-notifications", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50"
      role="banner"
    >
      <nav
        className="container mx-auto flex items-center justify-between p-4 min-h-[72px]"
        role="navigation"
        aria-label="Main navigation"
      >
        <Link to="/" className="flex items-center gap-2 group" aria-label="GameFlex Home">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-shadow">
            <Trophy className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            Game<span className="text-primary">Flex</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              )}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              <Button variant="ghost" size="icon" asChild aria-label="Messages">
                <Link to="/messages">
                  <MessageCircle className="h-5 w-5" />
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="relative"
                asChild
                aria-label="Notifications"
              >
                <Link to="/notifications">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold flex items-center justify-center text-destructive-foreground">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              </Button>

              <Button variant="outline" size="sm" className="gap-2" asChild aria-label="Wallet">
                <Link to="/wallet">
                  <Wallet className="h-4 w-4" />
                  <span className="font-semibold">
                    KES {(profile?.wallet_balance ?? 0).toLocaleString()}
                  </span>
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 pl-2" aria-label="User menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={optimizeImageUrl(
                          profile?.avatar_url || getGamerAvatar(profile?.username || user?.email),
                          { width: 150, quality: 75 },
                        )}
                      />
                      <AvatarFallback className="bg-primary/20 text-primary text-sm">
                        {(profile?.username ?? "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{profile?.username ?? "User"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border/50">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{profile?.username ?? "User"}</p>
                      <p className="text-xs text-muted-foreground">
                        {profile?.email ?? user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/social/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button variant="neon" asChild>
                <Link to="/register">Join Now</Link>
              </Button>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-11 w-11"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </nav>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border/50 backdrop-blur-xl bg-background/95">
          <div className="container mx-auto p-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "block px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                )}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-border/50 space-y-2">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary/50">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={optimizeImageUrl(
                          profile?.avatar_url || getGamerAvatar(profile?.username || user?.email),
                          { width: 150, quality: 75 },
                        )}
                      />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {(profile?.username ?? "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{profile?.username ?? "User"}</p>
                      <p className="text-sm text-muted-foreground">
                        KES {(profile?.wallet_balance ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-lg text-sm font-medium hover:bg-secondary min-h-[44px] flex items-center"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/social/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-lg text-sm font-medium hover:bg-secondary min-h-[44px] flex items-center"
                  >
                    Profile
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-lg text-sm font-medium hover:bg-secondary min-h-[44px] flex items-center"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 min-h-[44px] flex items-center"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-lg text-sm font-medium hover:bg-secondary min-h-[44px] flex items-center"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground text-center min-h-[44px] flex items-center justify-center"
                  >
                    Join Now
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
